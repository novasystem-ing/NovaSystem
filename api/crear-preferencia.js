import { MercadoPagoConfig, Preference } from "mercadopago";

/*
  Variables de entorno requeridas (configúralas en Vercel -> Project Settings -> Environment Variables):
    MP_ACCESS_TOKEN   -> Access Token de producción o de prueba de tu cuenta de Mercado Pago
    SITE_URL          -> ej: https://www.novasystemingenieria.com (para las back_urls y el webhook)
*/

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const SITE_URL = process.env.SITE_URL || "https://novasystemingenieria.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { modelo, titulo, valor } = req.body;

    if (!modelo || !valor) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const valorNumerico = Number(valor);
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    // Referencia única de la compra, útil para conciliar pagos en tus registros
    const referencia = `NSY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const preference = new Preference(client);

    const resultado = await preference.create({
      body: {
        external_reference: referencia,

        metadata: {
          comercio: "NovaSystem Ingeniería",
          modelo: modelo,
          tipo_producto: "Software digital"
        },

        notification_url: `${SITE_URL}/api/webhook`,

        items: [
          {
            title: titulo || `Software para ${modelo}`,
            description: `Software de recuperación / actualización para el televisor modelo: ${modelo}.`,
            quantity: 1,
            unit_price: valorNumerico,
            currency_id: "COP"
          }
        ],

        back_urls: {
          success: `${SITE_URL}/payment.html`,
          failure: SITE_URL,
          pending: SITE_URL
        },

        auto_return: "approved"
      }
    });

    return res.status(200).json({
      preference_id: resultado.id,
      external_reference: referencia
    });

  } catch (error) {
    console.error("Error Mercado Pago:", error);
    return res.status(500).json({ error: "Error creando preferencia" });
  }
}
