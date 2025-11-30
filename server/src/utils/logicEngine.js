const shouldShowQuestion = (rules, answers) => {
  
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const { logic, conditions } = rules;

  const results = conditions.map((cond) => {
    const userAnswer = answers[cond.questionKey];

    if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
      return false;
    }

    const answerStr = String(userAnswer);
    const valueStr = String(cond.value);

    switch (cond.operator) {
      case "equals":
        return answerStr === valueStr;
      case "notEquals":
        return answerStr !== valueStr;
      case "contains":
        if (Array.isArray(userAnswer)) {
          return userAnswer.includes(cond.value);
        }
        return answerStr.includes(valueStr);
      default:
        return false;
    }
  });

  if (logic === "OR") {
    return results.some((r) => r === true);
  }
  
  return results.every((r) => r === true);
};

module.exports = { shouldShowQuestion };