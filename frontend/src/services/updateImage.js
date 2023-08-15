export async function atualizarFoto(imagemProduto, idCom) {
  const urlBase = `${process.env.REACT_APP_BACKEND_URL}/companies/image/${idCom}`;
  const formData = new FormData();

  formData.append("file", imagemProduto);

  const response = await fetch(urlLogin, {
    method: "PUT",
    headers: {
      // "Content-Type": "application/json",
      authorization: getToken()
    },
    body: formData
  });

  const res = await response.json();

  return res;
}
