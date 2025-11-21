import React from 'react';
import styles from './App.module.css';

function App() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>E</div>
                    <span>Earth Vibe</span>
                </div>
                <nav className={styles.nav}>
                    <a href="#problem">El Problema</a>
                    <a href="#solution">Solución</a>
                    <a href="#team">Equipo</a>
                </nav>
            </header>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Recicla, Gana y <br /> Salva el Planeta</h1>
                    <p>
                        Sistema Social de Reciclaje Inteligente en la UPLA. Convierte tus botellas plásticas en recompensas y únete a la comunidad sostenible.
                    </p>
                    <div className={styles.ctaButtons}>
                        <button className={styles.btnPrimary}>Descargar App</button>
                        <button className={styles.btnSecondary}>Saber Más</button>
                    </div>
                </div>
                <div className={styles.heroImage}>
                    ♻️
                </div>
            </section>

            {/* Problem Section */}
            <section id="problem" className={styles.section}>
                <h2 className={styles.sectionTitle}>El Desafío del Plástico</h2>
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <span className={styles.cardIcon}>⚠️</span>
                        <h3>Contaminación Crítica</h3>
                        <p>El uso desmedido de plásticos de un solo uso está afectando nuestro campus y el medio ambiente.</p>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardIcon}>📉</span>
                        <h3>Baja Tasa de Reciclaje</h3>
                        <p>A pesar de la intención, la falta de incentivos reduce la participación activa en el reciclaje.</p>
                    </div>
                    <div className={styles.card}>
                        <span className={styles.cardIcon}>🗑️</span>
                        <h3>Contaminación Cruzada</h3>
                        <p>Los contenedores tradicionales suelen mezclar residuos, dificultando su procesamiento.</p>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section id="solution" className={styles.section} style={{ backgroundColor: '#f1f8e9' }}>
                <h2 className={styles.sectionTitle}>Nuestra Solución: Earth Vibe</h2>
                <div className={styles.grid}>
                    {/* Vibe Pod */}
                    <div className={styles.card}>
                        <span className={styles.cardIcon}>🤖</span>
                        <h3>Vibe Pod</h3>
                        <p>
                            Quiosco inteligente IoT con Raspberry Pi 5. Escanea códigos de barras, valida botellas y genera QRs únicos.
                        </p>
                    </div>

                    {/* App */}
                    <div className={styles.card}>
                        <span className={styles.cardIcon}>📱</span>
                        <h3>Earth Vibe App</h3>
                        <p>
                            Aplicación móvil para escanear QRs, acumular puntos y competir en rankings.
                        </p>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section id="team" className={styles.section}>
                <h2 className={styles.sectionTitle}>Equipo del Proyecto</h2>
                <div className={styles.grid} style={{ justifyContent: 'center' }}>
                    <div className={styles.teamMember}>
                        <div className={styles.avatar}>👨‍💻</div>
                        <h3>Villogas Gaspar, Alessandro</h3>
                        <p style={{ color: '#2e7d32' }}>Software Full-Stack / Desarrollo</p>
                    </div>
                    <div className={styles.teamMember}>
                        <div className={styles.avatar}>👩‍💻</div>
                        <h3>Cerron Villar, Maricielo Sarai</h3>
                        <p style={{ color: '#2e7d32' }}>Integrante del Equipo</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>© 2025 Earth Vibe. Todos los derechos reservados.</p>
                <div className={styles.footerLinks}>
                    <a href="#">Privacidad</a>
                    <a href="#">Términos</a>
                    <a href="#">Contacto</a>
                </div>
            </footer>
        </div>
    );
}

export default App;

