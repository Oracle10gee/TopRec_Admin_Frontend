export const environment = {
    production: true,
    apiUrl: process.env['API_URL'] || 'https://api.toprec.gov.ng/api/v1',
    remita: {
        baseUrl: 'https://login.remita.net',
        merchantId: '17021027969',
        serviceTypeId: '4430731',
        apiKey: 'BN8G1MIG',
        publicKey: 'VE9QUkVDfDE3MDIxMDI3OTY5fDJjZDFiMGY1YjcxY2MzYWI4NDM3N2VhMjRjMDBjZmY0ODA1ZDQ4NWVhZmEyMTA0MmVhZWJlNTNhNzc3MGRkMDg2MjNiZDc1ODViODBmZGEzYmMyZjE4ZDY4YzUyNDkxOThmNjBiYWNjMjNjNjBjZWI0ZDU1ZjcwYTZmZjk4Mjc4',
        webhookSecret: '23093b2bda801ekce94fc6e8363c05jad90a4ba3e120b5005141b0bab41704b3a148904529235afd1c9a3880d51b4018d11fd626b2cef77a6f858fe854834e54'
    }
};
