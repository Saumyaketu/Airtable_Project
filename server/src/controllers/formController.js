const axios = require('axios');
const Form = require('../models/Form');
const Response = require('../models/Response');
const User = require('../models/User');

const { shouldShowQuestion } = require('../utils/logicEngine');

const getAirtableClient = async (userId) => {
  const user = await User.findById(userId);
  
  return axios.create({
    headers: { Authorization: `Bearer ${user.accessToken}` }
  });
};

exports.getMyForms = async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFormResponses = async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await Form.findOne({ _id: formId, owner: req.user.id });
    if (!form) return res.status(403).json({ error: "Unauthorized access to this form" });

    const responses = await Response.find({ formId }).sort({ createdAt: -1 });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBases = async (req, res) => {
  try {
    const client = await getAirtableClient(req.user.id);
    const { data } = await client.get('https://api.airtable.com/v0/meta/bases');
    res.json(data.bases);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTables = async (req, res) => {
  try {
    const { baseId } = req.params;
    const client = await getAirtableClient(req.user.id);
    const { data } = await client.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);
    res.json(data.tables);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createForm = async (req, res) => {
  try {
    const { baseId, tableId, title, questions } = req.body;
    
    const client = await getAirtableClient(req.user.id);
    let webhookId = null;

    try {
      const listHooksRes = await client.get(`https://api.airtable.com/v0/bases/${baseId}/webhooks`);
      const existingHooks = listHooksRes.data.webhooks;

      if (existingHooks && existingHooks.length >= 1) {
        for (const hook of existingHooks) {
          await client.delete(`https://api.airtable.com/v0/bases/${baseId}/webhooks/${hook.id}`);
        }
      }
    } catch (cleanupErr) {
      console.log("Warning: Could not list/delete old webhooks.");
    }

    try {
      const hookRes = await client.post(`https://api.airtable.com/v0/bases/${baseId}/webhooks`, {
        notificationUrl: `${process.env.SERVER_URL}/api/webhooks/airtable`,
        specification: { options: { filters: { dataTypes: ['tableData'] } } } 
      });
      webhookId = hookRes.data.id;
    } catch (e) { 
      console.error("Webhook Failed Details:", e.response?.data || e.message);
    }

    const form = await Form.create({
      owner: req.user.id,
      airtableBaseId: baseId,
      airtableTableId: tableId,
      title,
      questions,
      webhookId
    });
    
    res.status(201).json(form);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getFormPublic = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: "Not found" });
    res.json(form);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.submitResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const form = await Form.findById(id).populate('owner');

    const formattedFields = {};
    for (const q of form.questions) {
      const isVisible = shouldShowQuestion(q.conditionalRules, answers);
      
      if (isVisible) {
        if (q.required && !answers[q.questionKey]) {
          return res.status(400).json({ error: `Missing required field: ${q.label}` });
        }
        
        if (answers[q.questionKey]) {
          formattedFields[q.airtableFieldId] = answers[q.questionKey];
        }
      }
    }

    const client = await getAirtableClient(form.owner._id);
    const atRes = await client.post(
      `https://api.airtable.com/v0/${form.airtableBaseId}/${form.airtableTableId}`,
      { fields: formattedFields }
    );

    const response = await Response.create({
      formId: form._id,
      airtableRecordId: atRes.data.id,
      answers
    });

    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
};