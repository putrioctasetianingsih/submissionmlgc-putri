const predictClassification = require("../services/InferenceService");
const crypto = require("crypto");
const storeData = require("../services/storeData");

async function postPredicthandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;
  const { confidenceScore, label, suggestion } = await predictClassification(
    model,
    image
  );

  const id = crypto.randomUUID();
  const createAt = new Date().toISOString();

  const data = {
    id: id,
    result: label,
    suggestion: suggestion,
    createAt: createAt,
  };

  await storeData(id, data);

  const response = h.response({
    status: "success",
    message:
      confidenceScore > 99
        ? "Model is predicted successfully"
        : "Model is predicted successfully but under threshold. Please use the correct picture",
    data,
  });
  response.code(201);
  return response;
}

async function predictHistories(request, h) {
  const { model } = request.server.app;
  const { Firestore } = require("google-cloud/firestore");
  const db = new Firestore({
    projectId: "submissionmlgc-putri-442701",
  });

  const predictCollection = db.collection("predictions");
  const snapshot = await predictCollection.get();
  const result = [];
  snapshot.forEach((doc) => {
    result.push({
      id: doc.id,
      history: {
        result: doc.data().result,
        createdAt: doc.data().createAt,
        suggestion: doc.data().suggestion,
        id: doc.data().id,
      },
    });
  });

  return h.response({
    status: "succcess",
    data: result,
  });
}

module.exports = { postPredicthandler, predictHistories };
