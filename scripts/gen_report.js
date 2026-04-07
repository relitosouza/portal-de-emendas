const fs = require('fs');
const path = require('path');

function generateCsv() {
    const rawData = fs.readFileSync(path.join(process.cwd(), 'data', 'amendments.json'), 'utf8');
    const data = JSON.parse(rawData);
    
    // Sort by Number to make duplicates visible side-by-side
    data.sort((a, b) => (a.numeroEmenda || '').localeCompare(b.numeroEmenda || ''));

    const header = [
        'ID',
        'Numero_Emenda',
        'Autor',
        'Objeto',
        'Destinacao',
        'Valor',
        'Funcao',
        'Subfuncao',
        'Status'
    ].join(';');

    const rows = data.map(a => {
        const escape = (val) => {
            const str = String(val || '').replace(/"/g, '""');
            return `"${str}"`;
        };

        return [
            escape(a.id),
            escape(a.numeroEmenda),
            escape(a.autor),
            escape(a.objeto),
            escape(a.destinacao),
            escape(a.valor),
            escape(a.funcao),
            escape(a.subfuncao),
            escape(a.status)
        ].join(';');
    });

    const csvContent = '\uFEFF' + header + '\n' + rows.join('\n');
    fs.writeFileSync('relatorio_amendments.csv', csvContent, 'utf8');
    console.log('Relatório gerado com sucesso: relatorio_amendments.csv');
    console.log('Total de registros:', data.length);
}

generateCsv();
