import whatsappService from './whatsappService.js';

class MessageHandler {
  constructor() {
    this.appointmenState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      } else if (incomingMessage === 'media') {
        await this.sendMedia(message.from);
      } else {
        const state = this.appointmenState[message.from];
        if (state) {
          // Continuar flujo de compra si el estado está activo
          await this.handleAppointmentFlow(message.from, incomingMessage);
        } else {
          const response = `Echo: ${message.text.body}`;
          await whatsappService.sendMessage(message.from, response, message.id);
        }
      }
      await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(message.from, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "hello", "hi", "buenas tardes", "buenos días", "buenas noches", "¡Hola, quiero más información sobre sus productos!"];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id;
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `Hola ${name}, Bienvenido a UP STORE, tu tienda de accesorios y más. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una Opción";
    const buttons = [
      { type: 'reply', reply: { id: 'option_1', title: 'Ver Productos' } },
      { type: 'reply', reply: { id: 'option_2', title: 'Promociones' } },
      { type: 'reply', reply: { id: 'option_3', title: 'Hablar con un Asesor' } }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendAdditionalOptionsMenu(to) {
    const menuMessage = "¿Qué te gustaría hacer ahora?";
    const buttons = [
      { type: 'reply', reply: { id: 'option_4', title: 'Comprar Producto' } },
      { type: 'reply', reply: { id: 'option_5', title: 'Contactar Asesor' } }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option) {
    let response;

    switch (option) {
      case 'ver productos':
        await this.sendMedia(to, 'document', 'https://drive.google.com/uc?export=download&id=1SZ8gDr7dWofGlt-1f6osr_MZmbnRMhiP', '¡Aquí están los productos que tenemos en este año 2025!');
        await this.sendAdditionalOptionsMenu(to);
        break;

      case 'promociones':
        response = "Nuestras promociones están agotadas por el momento. ¡Pero no te preocupes! Estamos trabajando en nuevas promociones para ti. 😊";
        break;

      case 'hablar con un asesor':
        response = 'Un asesor se pondrá en contacto contigo en breve.';
        break;

      case 'comprar producto':
        this.appointmenState[to] = { step: 'name' };
        response = "Indícanos tu nombre para continuar con la compra.";
        break;

      case 'contactar asesor':
        response = `Gracias por tu interés. Un asesor se pondrá en contacto contigo lo antes posible. Si deseas acelerar el proceso, por favor proporciona más detalles sobre tu consulta. 😊`;
        break;

      default:
        response = "Lo siento, no entendí tu selección. Por favor, elige una de las opciones del menú.";
    }

    if (response) {
      await whatsappService.sendMessage(to, response);
    }
  }
  completeAppointment(to) {
    const appointment = this.appointmenState[to];
    if (!appointment) {
      return console.log("No se encontró ninguna cita activa para este número.");
    }
  
    // Registro de datos del usuario
    const userData = [
      to,
      appointment.name,
      appointment.celular,
      appointment.direccion,
      new Date().toISOString()
    ];
    console.log('Datos del usuario:', userData);
  
    // Simula guardado en la base de datos
    this.saveAppointmentToDatabase(appointment);
  
    // Eliminar el estado de la cita para este usuario
    delete this.appointmenState[to];
  
    // Mensaje de confirmación final al usuario
    const completionMessage = `¡Gracias por confirmar tu pedido, ${appointment.name}! Procederemos a procesar tu pedido y te enviaremos una confirmación por este medio pronto. 😊`;
    whatsappService.sendMessage(to, completionMessage);
  }
  
  async handleAppointmentFlow(to, message) {
    if (!this.appointmenState[to]) {
      this.appointmenState[to] = { step: 'name' };
    }

    const state = this.appointmenState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'celular';
        response = 'Por favor, indícame tu número de celular para continuar con la programación del envío.';
        break;

      case 'celular':
        state.celular = message;
        state.step = 'direccion';
        response = 'Perfecto. Ahora, por favor indícame tu dirección de envío.';
        break;

      case 'direccion':
        state.direccion = message;
        state.step = 'confirmar';
        response = `¡Gracias! Hemos recibido tu información:\n
        - Nombre: ${state.name}\n
        - Celular: ${state.celular}\n
        - Dirección: ${state.direccion}\n
        ¿Es correcto? Responde con "Sí" para confirmar o "No" para reiniciar.`;
        break;

      case 'confirmar':
        if (message.toLowerCase() === 'si') {
          response = this.completeAppointment(to);
          this.saveAppointmentToDatabase(state);
          delete this.appointmenState[to];
          await this.sendPaymentMethod(to);
        } else if (message.toLowerCase() === 'no') {
          response = 'Entiendo. Vamos a reiniciar el proceso. Por favor, indícame tu nombre.';
          state.step = 'name';
        } else {
          response = 'Por favor responde con "Si" o "No".';
        }
        break;

      default:
        response = 'Lo siento, no entendí tu mensaje. Por favor, indícame tu nombre para continuar.';
        state.step = 'name';
    }

    await whatsappService.sendMessage(to, response);
  }
  async sendPaymentMethod(to) {
    const paymentMessage = `¡Gracias por elegir ShopLife! Para realizar el pago por Yape, utiliza los siguientes datos:

👉 Número de Yape: *959166911*  
👉 Nombre: *José Urcia*

Una vez realizado el pago, envíanos una captura para confirmar tu pedido. ¡Agradecemos tu preferencia! 😊`;
    await whatsappService.sendMessage(to, paymentMessage);
  }

  async sendMedia(to, type, mediaUrl, caption) {
    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  saveAppointmentToDatabase(state) {
    console.log("Datos guardados en la base de datos:", state);
  }
}

export default new MessageHandler();
