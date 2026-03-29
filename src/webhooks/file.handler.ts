import axios from "axios";

export async function handleMedia(mediaId: string, token: string) {
  // obtener URL temporal
  const mediaUrlResp = await axios.get(
    `https://graph.facebook.com/v20.0/${mediaId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const url = mediaUrlResp.data.url;

  // descargar archivo
  const file = await axios.get(url, {
    responseType: "arraybuffer",
    headers: { Authorization: `Bearer ${token}` },
  });

  return file.data; // buffer
}