const mongoose = require("mongoose");

const ConditionSchema = new mongoose.Schema({
  questionKey: String,
  operator: {
    type: String,
    enum: ["equals", "notEquals", "contains"],
  },
  value: mongoose.Schema.Types.Mixed,
});

const QuestionSchema = new mongoose.Schema({
  questionKey: String,
  airtableFieldId: String,
  label: String,
  type: String,
  options: [String],
  required: {
    type: Boolean,
    default: false,
  },
  conditionalRules: {
    logic: {
      type: String,
      enum: ["AND", "OR"],
      default: "AND",
    },
    conditions: [ConditionSchema],
  },
});

const FormSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    airtableBaseId: String,
    airtableTableId: String,
    title: String,
    questions: [QuestionSchema],
    webhookId: String,
    cursor: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Form", FormSchema);