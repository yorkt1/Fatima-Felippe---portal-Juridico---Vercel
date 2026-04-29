export default function SkeletonArticleDetail() {
    return (
        <div className="container" style={{ padding: '20px 0' }}>
            <div className="article-content" style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
                <div className="article-header" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e6e9ee' }}>
                    {/* Category */}
                    <div className="skeleton" style={{
                        width: '120px',
                        height: '24px',
                        marginBottom: '8px',
                        borderRadius: '4px'
                    }}></div>

                    {/* Title */}
                    <div className="skeleton" style={{
                        width: '90%',
                        height: '36px',
                        marginBottom: '10px',
                        borderRadius: '4px'
                    }}></div>
                    <div className="skeleton" style={{
                        width: '70%',
                        height: '36px',
                        marginBottom: '20px',
                        borderRadius: '4px'
                    }}></div>

                    {/* Meta */}
                    <div className="article-meta" style={{ display: 'flex', gap: '20px' }}>
                        <div className="skeleton" style={{ width: '150px', height: '16px', borderRadius: '4px' }}></div>
                        <div className="skeleton" style={{ width: '100px', height: '16px', borderRadius: '4px' }}></div>
                    </div>
                </div>

                {/* Hero Image */}
                <div className="skeleton" style={{
                    width: '100%',
                    height: '400px',
                    borderRadius: '10px',
                    marginBottom: '30px'
                }}></div>

                {/* Content Body */}
                <div className="article-section">
                    <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '95%', height: '16px', marginBottom: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '90%', height: '16px', marginBottom: '30px', borderRadius: '4px' }}></div>

                    <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '98%', height: '16px', marginBottom: '12px', borderRadius: '4px' }}></div>
                    <div className="skeleton" style={{ width: '92%', height: '16px', marginBottom: '12px', borderRadius: '4px' }}></div>
                </div>

                {/* Back Button */}
                <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    <div className="skeleton" style={{
                        width: '200px',
                        height: '40px',
                        borderRadius: '8px'
                    }}></div>
                </div>
            </div>
        </div>
    );
}
