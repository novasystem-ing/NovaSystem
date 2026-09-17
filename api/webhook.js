/*
  Mercado Pago llama esta URL automáticamente cuando cambia el estado de un pago
  (aprobado, rechazado, pendiente). Por ahora solo registra el evento.

  Para completarlo:
    1. Lee el "id" y "topic"/"type" que envía Mercado Pago en el body o query.
    2. Usa el SDK (new Payment(client).get({ id })) para consultar el estado real del pago.
    3. Si está aprobado, marca el pedido como pagado en tu propio registro
       (base de datos, hoja de cálculo, etc.) y envía el software/manual al cliente
       (por correo o generando un link de descarga temporal).
    4. Responde siempre 200 rápido; Mercado Pago reintenta si no recibe 200.
*/

export default async function handler(req, res) {
  try {
    console.log("Webhook Mercado Pago recibido:", JSON.stringify(req.body || req.query));

    // TODO: verificar el pago real contra la API de Mercado Pago antes de darlo por válido.

    return res.status(200).json({ recibido: true });
  } catch (error) {
    console.error("Error en webhook:", error);
    // Aun así respondemos 200 para que Mercado Pago no reintente indefinidamente
    // mientras se investiga el error en los logs.
    return res.status(200).json({ recibido: true });
  }
}
