
import emailjs from '@emailjs/browser';

export default function EmailSend(receiver_email:string, name:string, message:string) {
    
    const Service_ID:string = process.env.NEXT_PUBLIC_SERVICE_ID || '';
    const Template_ID:string = process.env.NEXT_PUBLIC_TEMPLATE_ID || '';
    const Public_Key:string =  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
    
    emailjs.send(
        Service_ID,
        Template_ID,
        {
          to_name: name,
          from_name: "BD Railway",
          message: message
        },
        Public_Key
      )
      .then(response => {
        console.log('SUCCESS!', response.status, response.text);
      }, error => {
        console.error('FAILED...', error);
      });

    
  }