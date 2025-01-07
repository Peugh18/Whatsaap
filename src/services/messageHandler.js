import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if(this.isGreeting(incomingMessage)){
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      } else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(message.from, response, message.id);
      }
      await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(message.from, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "hello", "hi", "buenas tardes", "buenos días", "buenas noches"];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id;
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `Hola ${name}, Bienvenido a ShopLife, tu tienda de accesorios y maás. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una Opción"
    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: 'Ver Productos' }
      },
      { 
        type: 'reply', reply: { id: 'option_2', title: 'Promociones'}
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Hablar con un Ases.'}
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option) {
    console.log(option)
    let response;
    switch (option) {
      case 'ver productos':
        response = "Estos son nuestros productos";
        break;
      case 'promociones':
        response = "Estas son nuestras promociones";
        break
      case 'hablar con un ases.': 
       response = 'Un asesor se pondrá en contacto contigo en breve.';
       break
      default: 
       response = "Lo siento, no entendí tu selección, Por Favor, elige una de las opciones del menú."
    }
    await whatsappService.sendMessage(to, response);
  }

}

export default new MessageHandler();