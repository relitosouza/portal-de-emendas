import "dotenv/config";

const OSASCO_API_URL = 'https://transparencia-osasco.smarapd.com.br/paiportalserver/modulovisao/filter';

async function main() {
    // 1. Query EmendasParlamentares
    const payloadEmendas = {
        "ChaveModulo": "66",
        "NomeVisao": "EmendasParlamentares",
        "Filtros": [],
        "Periodicidade": "ANUAL",
        "Periodo": "",
        "Exercicio": 2026,
        "Pagina": 1,
        "QuantidadeRegistros": "1000",
        "Ordenacao": [{ "ColunaOrdem": "Objeto", "TipoOrdem": "ascend", "Ordem": 1 }]
    };

    const resEmendas = await fetch(OSASCO_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://transparencia-osasco.smarapd.com.br',
            'Referer': 'https://transparencia-osasco.smarapd.com.br/'
        },
        body: JSON.stringify(payloadEmendas)
    });

    if (resEmendas.ok) {
        let data = await resEmendas.json() as any;
        if (typeof data === 'string') data = JSON.parse(data);
        const records = data.Valores as any[];
        const match = records.filter(r => r.Vinculo === "08.804.0227");
        console.log("=== EmendasParlamentares Portal Records for 08.804.0227 ===");
        for (const r of match) {
            console.log(JSON.stringify({
                Vinculo: r.Vinculo,
                Autor: r.AutorEmenda,
                Objeto: r.Objeto?.substring(0, 45),
                Reservado: r.Reservado,
                Empenhado: r.Empenhado,
                EmpenhadoAnulado: r.EmpenhadoAnulado,
                Liquidado: r.Liquidado,
                ValorPago: r.ValorPago
            }, null, 2));
        }
    }

    // 2. Query MovimentoEmpenho
    const payloadMovimentos = {
        "ChaveModulo": "aquisicoes_covid",
        "NomeVisao": "MovimentoEmpenho",
        "Filtros": [
            { "Campo": "Vinculo", "Valor": "08.804.0227", "TipoValor": 8 }
        ],
        "Periodicidade": "ANUAL",
        "Periodo": "",
        "Exercicio": 2026,
        "Pagina": 1,
        "QuantidadeRegistros": "100",
        "Ordenacao": [{ "ColunaOrdem": "DescrFornecedor", "TipoOrdem": "ascend", "Ordem": 1 }]
    };

    const resMovimentos = await fetch(OSASCO_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://transparencia-osasco.smarapd.com.br',
            'Referer': 'https://transparencia-osasco.smarapd.com.br/'
        },
        body: JSON.stringify(payloadMovimentos)
    });

    if (resMovimentos.ok) {
        let data = await resMovimentos.json() as any;
        if (typeof data === 'string') data = JSON.parse(data);
        const records = data.Valores as any[];
        console.log("\n=== MovimentoEmpenho Portal Records for 08.804.0227 ===");
        for (const r of records) {
            console.log(JSON.stringify({
                Vinculo: r.Vinculo,
                NrEmpenho: r.NrEmpenho,
                ExercEmpenho: r.ExercEmpenho,
                DescrFornecedor: r.DescrFornecedor?.trim(),
                VlrEmpenho: r.VlrEmpenho
            }, null, 2));
        }
    }
}

main();
