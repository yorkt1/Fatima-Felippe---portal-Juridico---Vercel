export default function SkeletonCard() {
    return (
        <div className="post skeleton-wrapper">
            {/* Imagem side-by-side no layout horizontal original */}
            <div className="skeleton" style={{
                width: '160px',
                minWidth: '160px',
                height: '110px',
                borderRadius: '8px'
            }}></div>

            <div style={{ flex: 1, width: '100%' }}>
                <div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ width: '90%', height: '18px', borderRadius: '4px', marginBottom: '6px' }}></div>
                <div className="skeleton" style={{ width: '70%', height: '18px', borderRadius: '4px', marginBottom: '10px' }}></div>

                <div className="skeleton" style={{ width: '100%', height: '12px', borderRadius: '4px', marginBottom: '4px' }}></div>
                <div className="skeleton" style={{ width: '95%', height: '12px', borderRadius: '4px', marginBottom: '4px' }}></div>
                <div className="skeleton" style={{ width: '80%', height: '12px', borderRadius: '4px' }}></div>
            </div>
        </div>
    );
}
