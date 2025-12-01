const axios = require("axios");
const Form = require("../models/Form");
const Response = require("../models/Response");
const User = require("../models/User");

exports.handleWebhook = async (req, res) => {
  try {
    const { webhook, base } = req.body;

    if (!webhook || !webhook.id) {
      return res.status(400).send("Invalid payload");
    }

    const form = await Form.findOne({ webhookId: webhook.id }).populate("owner");

    if (!form) {
      return res.status(200).send("Form not found, ignoring");
    }

    const user = form.owner;
    const client = axios.create({
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    const url = `https://api.airtable.com/v0/bases/${base.id}/webhooks/${webhook.id}/payloads?cursor=${form.cursor}`;
    const { data } = await client.get(url);
    const payloads = data.payloads;

    for (const payload of payloads) {
      const tableChanges = payload.changedTablesById?.[form.airtableTableId];

      if (tableChanges) {
        //update
        if (tableChanges.changedRecordsById) {
          const fieldMap = {};
          form.questions.forEach((q) => {
            fieldMap[q.airtableFieldId] = q.questionKey;
          });

          for (const [recordId, change] of Object.entries(
            tableChanges.changedRecordsById
          )) {
            const cellValues = change.current?.cellValuesByFieldId;
            if (cellValues) {
              const response = await Response.findOne({
                airtableRecordId: recordId,
              });
              if (response) {
                let updated = false;
                for (const [fieldId, value] of Object.entries(cellValues)) {
                  const questionKey = fieldMap[fieldId];
                  if (questionKey) {
                    response.answers[questionKey] = value;
                    updated = true;
                  }
                }
                if (updated) {
                  response.markModified("answers");
                  await response.save();
                }
              }
            }
          }
        }

        //delete
        if (tableChanges.destroyedRecordIds) {
          for (const recordId of tableChanges.destroyedRecordIds) {
            await Response.findOneAndUpdate(
              { airtableRecordId: recordId },
              { status: "deletedInAirtable" }
            );
          }
        }
      }
    }

    if (data.cursor > form.cursor) {
      form.cursor = data.cursor;
      await form.save();
    }

    res.status(200).send("Sync successful");
  } catch (error) {
    console.error("Webhook Error:", error.response?.data || error.message);
    res.status(500).send("Error processing webhook");
  }
};