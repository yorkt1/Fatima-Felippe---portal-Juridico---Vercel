import { useEffect } from 'react';

export default function PrivacyPage() {
    useEffect(() => {
        document.title = 'Política de Privacidade — Portal Jurídico Fátima Felippe';
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="container">
            <div className="content-box">
                <h1>Política de Privacidade</h1>
                <p>Esta Política de Privacidade explica como este portal jurídico coleta, utiliza e protege as informações dos visitantes. Ao navegar no site, você concorda com as práticas descritas abaixo.</p>

                <h2>1. Informações Coletadas</h2>
                <p>Coletamos apenas dados necessários para o funcionamento do site, incluindo:</p>
                <ul>
                    <li><strong>Dados de navegação:</strong> Coletados automaticamente através de cookies e tecnologias similares para melhorar a experiência do usuário.</li>
                    <li><strong>Dados fornecidos voluntariamente:</strong> Informações inseridas em formulários de contato, como nome, e-mail, telefone e mensagem.</li>
                    <li><strong>Dados analíticos:</strong> Coletados pelo Google Analytics, como páginas visitadas, tempo de sessão, tipo de navegador, dispositivo utilizado, origem do tráfego e dados demográficos aproximados. Não coletamos dados sensíveis sem seu consentimento expresso e prévio.</li>
                </ul>

                <h2>2. Uso das Informações</h2>
                <p>As informações coletadas são utilizadas exclusivamente para:</p>
                <ul>
                    <li>Operar, manter e melhorar o desempenho e a navegação no site;</li>
                    <li>Responder a contatos, solicitações e dúvidas enviadas através dos formulários;</li>
                    <li>Analisar o tráfego e o comportamento dos usuários no site (via Google Analytics) para entender melhor nosso público e aprimorar nosso conteúdo e serviços;</li>
                    <li>Cumprir obrigações legais, quando aplicável.</li>
                </ul>

                <h2>3. Compartilhamento de Dados</h2>
                <p>Os dados podem ser compartilhados apenas com serviços essenciais para a operação do site e dentro das bases legais permitidas pela LGPD:</p>
                <ul>
                    <li><strong>Prestadores de serviços terceirizados:</strong> Como empresas de hospedagem de sites e plataformas de e-mail, que atuam como operadores de dados e estão sob contrato de confidencialidade.</li>
                    <li><strong>Google LLC:</strong> Fornecedor do serviço Google Analytics, para processamento dos dados de análise conforme seus Termos de Serviço e Política de Privacidade. Informamos que os dados coletados pelo Analytics podem ser transferidos e armazenados em servidores localizados fora do Brasil.</li>
                </ul>
                <p>Nenhuma informação pessoal é vendida, alugada ou compartilhada para fins comerciais com terceiros não essenciais.</p>

                <h2>4. Cookies e Google Analytics</h2>
                <p>Este site utiliza cookies, incluindo os do serviço Google Analytics. Cookies são pequenos arquivos de texto armazenados no seu navegador.</p>
                <p><strong>Google Analytics:</strong> Utilizamos este serviço para entender como os visitantes interagem com nosso site. O Google Analytics coleta informações de forma anônima, como quantas pessoas visitaram o site, quais páginas são mais populares e a origem do tráfego. Para garantir maior privacidade, ativamos a anonimização de IP, o que significa que seu endereço IP é truncado antes do armazenamento.</p>
                <p><strong>Gerenciamento de Cookies:</strong> Ao acessar nosso site, um banner de cookies será exibido solicitando seu consentimento para o uso de cookies analíticos (Google Analytics). Você pode:</p>
                <ul>
                    <li>Aceitar o uso de todos os cookies.</li>
                    <li>Recusar os cookies analíticos, navegando apenas com os cookies essenciais para o funcionamento do site.</li>
                    <li>Gerenciar suas preferências a qualquer momento através das configurações do seu navegador.</li>
                </ul>

                <h2>5. Direitos do Usuário (LGPD)</h2>
                <p>De acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018), você, enquanto titular dos dados, tem os seguintes direitos:</p>
                <ul>
                    <li><strong>Confirmação e Acesso:</strong> Solicitar confirmação da existência de tratamento e acesso aos seus dados.</li>
                    <li><strong>Correção:</strong> Pedir a correção de dados incompletos, inexatos ou desatualizados.</li>
                    <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.</li>
                    <li><strong>Portabilidade:</strong> Solicitar a portabilidade dos dados a outro fornecedor de serviço ou produto, quando aplicável.</li>
                    <li><strong>Eliminação dos dados tratados com consentimento:</strong> Pedir a eliminação dos dados cujo tratamento foi baseado no seu consentimento.</li>
                    <li><strong>Informação sobre compartilhamento:</strong> Obter informação sobre as entidades públicas e privadas com as quais seus dados foram compartilhados.</li>
                    <li><strong>Revogação do Consentimento:</strong> Revogar seu consentimento a qualquer momento, sendo que isso não afetará a licitude de qualquer tratamento realizado anteriormente à revogação.</li>
                    <li><strong>Oposição:</strong> Opor-se a tratamentos realizados com base no legítimo interesse.</li>
                </ul>
                <p>Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail ou telefone disponível na página "Contato". Responderemos sua solicitação no prazo estabelecido pela LGPD.</p>

                <h2>6. Segurança das Informações</h2>
                <p>Adotamos medidas técnicas e administrativas adequadas para proteger seus dados contra acessos não autorizados, situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito. No entanto, nenhum sistema de segurança é infalível, e nos comprometemos a agir em conformidade com a legislação em caso de incidentes.</p>

                <h2>7. Responsável pelo Tratamento de Dados (Controladora)</h2>
                <p>O tratamento dos dados é realizado sob a responsabilidade de:</p>
                <p><strong>Fatima T. Felippe – OAB/SC 42.113</strong><br />Advogada Responsável<br />Contato disponível na página "Contato".</p>

                <h2>8. Atualizações desta Política</h2>
                <p>Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou na legislação. A versão mais recente estará sempre disponível nesta página, com a data da última atualização indicada no topo do documento. Recomendamos que você a revise periodicamente.</p>

                <p style={{ marginTop: '18px', fontWeight: 600 }}>Última atualização: 09 / dezembro / 2025</p>
            </div>
        </main>
    );
}
