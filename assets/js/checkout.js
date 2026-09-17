/*
  checkout.js
  Se usa solo en las páginas de producto (una por modelo).
  Lee los datos del producto desde el <script type="application/json" id="product-data">
  que el build.js incrusta en cada página (no depende de cargar todo el catálogo).
*/
(function(){
  "use strict";

  var dataEl = document.getElementById('product-data');
  if(!dataEl) return;

  var info = JSON.parse(dataEl.textContent);

  /* ---------- WhatsApp ---------- */
  var whatsappBtn = document.getElementById('whatsappBtn');
  if(whatsappBtn){
    var mensaje = 'Hola ' + info.nombreNegocio + ' 👋\n\n' +
      'Estoy interesado en el siguiente software.\n\n' +
      '*Modelo:* ' + info.modelo + '\n' +
      '*Precio:* ' + info.precio + '\n' +
      '*Estado:* ' + info.estado + '\n\n' +
      '¿Podrían brindarme más información?\n\n' +
      'Muchas gracias.';
    whatsappBtn.href = 'https://api.whatsapp.com/send?phone=' + info.telefonoWhatsApp + '&text=' + encodeURIComponent(mensaje);
  }

  /* ---------- Botón de pago real (Mercado Pago) ---------- */
  var mpButtonContainer = document.getElementById('mp-button');

  async function crearPreferencia(){
    var respuesta = await fetch('/api/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelo: info.modelo,
        titulo: 'Servicio técnico ' + info.modelo,
        valor: info.valor
      })
    });

    if(!respuesta.ok){
      throw new Error('El servidor respondió con un error al crear la preferencia');
    }

    var datos = await respuesta.json();
    if(!datos.preference_id){
      throw new Error('No se creó la preferencia de pago');
    }
    return datos.preference_id;
  }

  if(mpButtonContainer){
    if(info.estado.toLowerCase() === 'agotado'){
      mpButtonContainer.innerHTML = '<p class="mp-unavailable">Este producto no está disponible por ahora. Escríbenos por WhatsApp para más opciones.</p>';
    } else {
      crearPreferencia()
        .then(function(preferenceId){
          var script = document.createElement('script');
          script.src = 'https://www.mercadopago.com.co/integrations/v1/web-payment-checkout.js';
          script.setAttribute('data-preference-id', preferenceId);
          script.setAttribute('data-source', 'button');
          mpButtonContainer.appendChild(script);
        })
        .catch(function(error){
          console.error('Error Mercado Pago:', error);
          mpButtonContainer.innerHTML = '<p class="mp-unavailable">No pudimos cargar el botón de pago en este momento. Puedes comprar directamente por WhatsApp mientras tanto.</p>';
        });
    }
  }

})();
