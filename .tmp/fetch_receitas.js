const fs = require('fs');

async function fetchReceitas() {
    const url = 'https://transparencia-osasco.smarapd.com.br/paiportalserver/modulovisao/filter';
    
    const payload = {
        "ChaveModulo": "emendas_parlamentares",
        "NomeVisao": "emendasrecebidas",
        "Filtros": [],
        "Periodicidade": "ANUAL",
        "Periodo": "",
        "Exercicio": 2026,
        "Pagina": 1,
        "QuantidadeRegistros": "1000",
        "Ordenacao": []
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://transparencia-osasco.smarapd.com.br',
                'Referer': 'https://transparencia-osasco.smarapd.com.br/'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            console.error("Response:", text);
            return;
        }

        let data = await response.json();
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        fs.writeFileSync('.tmp/receitas.json', JSON.stringify(data, null, 2));
        console.log(`Saved ${data.Valores ? data.Valores.length : 0} records to .tmp/receitas.json`);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchReceitas();
