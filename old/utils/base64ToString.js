const convertBase64ToString = (data) => {
  const [_, rest] = data.split(",");
  const buff = Buffer.from(rest, "base64");
  const text = buff.toString("utf-8");

  return text;
};

module.exports = convertBase64ToString;
