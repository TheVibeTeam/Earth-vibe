import React from 'react';
import styles from './css/Home.module.css';

const Home: React.FC = () => {
    return (
        <div className={styles.homeContainer}>
            <header className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.title}>Auralix</h1>
                    <p className={styles.subtitle}>
                        Soluciones de software personalizadas para tu negocio.
                    </p>
                </div>
            </header>
            <footer className={styles.footer}>
                <p>© {new Date().getFullYear()} Auralix. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default Home;
