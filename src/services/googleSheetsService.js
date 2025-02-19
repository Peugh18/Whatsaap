import path from 'path';
import { google } from 'googleapis';

const sheets = google.sheets('v4');

async function addRowToSheet(auth, spreadsheetId, values) {
    const request = {
        spreadsheetId,
        range: 'pedidos',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: [values],
        },
        auth,
    }

    try {
        console.log('Request:', request);
        const response = (await sheets.spreadsheets.values.append(request)).data;
        console.log('Response:', response);
        return response;
    } catch (error) {
        console.error('Error adding row to sheet:', error);
    }
}

const appendToSheet = async (data) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'src/credentials', 'credentials.json'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const authClient = await auth.getClient();
        const spreadsheetId = '1Rx1LEt7oJ8S2E-nq3elpVWxN-q5F85W0NYRoa5ExQdI';

        console.log('Auth client:', authClient);
        console.log('Spreadsheet ID:', spreadsheetId);
        console.log('Data to append:', data);

        await addRowToSheet(authClient, spreadsheetId, data);
        return 'Datos correctamente agregados';
    } catch (error) {
        console.error('Error appending to sheet:', error);
    }
}

export default appendToSheet;