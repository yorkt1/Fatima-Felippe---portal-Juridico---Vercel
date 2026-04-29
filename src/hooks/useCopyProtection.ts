import { useEffect } from 'react';

export const useCopyProtection = () => {
    useEffect(() => {
        const handleCopy = () => {
            alert('⚠️ Conteúdo do Portal Jurídico\n\nO conteúdo deste portal é aberto e pode ser reproduzido, desde que a fonte "fatimafelippe.com.br" seja citada.\n\nObrigado por respeitar nossa autoria!');
        };

        document.addEventListener('copy', handleCopy);

        return () => {
            document.removeEventListener('copy', handleCopy);
        };
    }, []);
};
