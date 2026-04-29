import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-banner active">
            <div className="cookie-message">
                Este site utiliza cookies para melhorar sua experiência. Ao continuar, você concorda com nossa <Link to="/privacidade">Política de Privacidade</Link>.
            </div>
            <div className="cookie-actions">
                <Link className="cookie-btn" to="/privacidade">Saiba mais</Link>
                <button className="cookie-btn accept" onClick={acceptCookies}>Ok</button>
            </div>
        </div>
    );
}
