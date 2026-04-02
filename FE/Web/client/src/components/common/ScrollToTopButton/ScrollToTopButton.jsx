import { ArrowUpOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import styles from './ScrollToTopButton.module.css';

const getScrollTop = (scrollContainer) => {
  if (scrollContainer === window) {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  return scrollContainer?.scrollTop || 0;
};

const smoothScrollTop = (scrollContainer) => {
  if (scrollContainer === window) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (scrollContainer?.scrollTo) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

export default function ScrollToTopButton({ threshold = 300, containerRef = null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = containerRef?.current || window;

    const handleScroll = () => {
      setVisible(getScrollTop(target) > threshold);
    };

    handleScroll();
    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, threshold]);

  const handleScrollToTop = () => {
    smoothScrollTop(containerRef?.current || window);
  };

  return (
    <button
      type="button"
      aria-label="Cuộn lên đầu trang"
      className={`${styles.scrollToTopButton} ${visible ? styles.visible : ''}`}
      onClick={handleScrollToTop}
    >
      <ArrowUpOutlined />
    </button>
  );
}
