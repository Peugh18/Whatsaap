import axios from 'axios';
import config from '../config/env.js';

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    try {
      // Verificamos que 'body' no esté vacío
      if (!body) {
        console.error('El cuerpo del mensaje no puede estar vacío');
        return;
      }

      // Enviar mensaje de texto
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to,
          text: { body }, // Aquí aseguramos que 'body' sea un objeto con el texto
          // Se descomenta el 'context' si necesitas usar el ID del mensaje
          // context: {
          //   message_id: messageId,
          // },
        },
      });
      console.log('Mensaje enviado con éxito');
    } catch (error) {
      console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
    }
  }

  async markAsRead(messageId) {
    try {
      if (!messageId) {
        console.error('El ID del mensaje no puede estar vacío');
        return;
      }

      // Marcar el mensaje como leído
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
      });
      console.log('Mensaje marcado como leído');
    } catch (error) {
      console.error('Error al marcar el mensaje como leído:', error.response ? error.response.data : error.message);
    }
  }

  async sendInteractiveButtons(to, bodyText, buttons) {
    try {
      if (!bodyText || !buttons || buttons.length === 0) {
        console.error('El texto del mensaje y los botones son requeridos');
        return;
      }

      // Enviar botones interactivos
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons,
            },
          },
        },
      });
      console.log('Mensaje interactivo enviado con éxito');
    } catch (error) {
      console.error('Error al enviar el mensaje interactivo:', error.response ? error.response.data : error.message);
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      if (!mediaUrl || !type) {
        console.error('El tipo de medio y la URL son requeridos');
        return;
      }

      const mediaObject = {};

      switch (type) {
        case 'image':
          mediaObject.image = { link: mediaUrl, caption };
          break;
        case 'audio':
          mediaObject.audio = { link: mediaUrl };
          break;
        case 'video':
          mediaObject.video = { link: mediaUrl, caption };
          break;
        case 'document':
          mediaObject.document = { link: mediaUrl, caption, filename: 'productos.pdf' };
          break;
        default:
          console.error('Tipo de medio no soportado');
          return;
      }

      // Enviar mensaje multimedia
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to,
          type,
          ...mediaObject, // Desestructuramos el objeto de medios
        },
      });
      console.log('Mensaje multimedia enviado con éxito');
    } catch (error) {
      console.error('Error al enviar el mensaje multimedia:', error.response ? error.response.data : error.message);
    }
  }
}

export default new WhatsAppService();
