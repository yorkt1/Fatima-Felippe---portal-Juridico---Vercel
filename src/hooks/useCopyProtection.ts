import { useEffect } from 'react';

// Avisa (com citação de fonte) quando alguém copia texto do site público.
// `enabled = false` desliga o aviso — usado no painel administrativo, onde
// copiar texto no editor não deve disparar esse alerta.
export const useCopyProtection = (enabled = true) => {
    useEffect(() => {
        if (!enabled) return;

        const handleCopy = () => {
            alert('⚠️ Conteúdo do Portal Jurídico\n\nO conteúdo deste portal é aberto e pode ser reproduzido, desde que a fonte "fatimafelippe.com.br" seja citada.\n\nObrigado por respeitar nossa autoria!');
        };

        document.addEventListener('copy', handleCopy);

        return () => {
            document.removeEventListener('copy', handleCopy);
        };
    }, [enabled]);
};
