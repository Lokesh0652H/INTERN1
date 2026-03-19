import { useSpring, animated } from '@react-spring/web';
import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

export default function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0, duration = 1500 }: AnimatedCounterProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const spring = useSpring({
    from: { val: 0 },
    to: { val: visible ? value : 0 },
    config: { duration },
  });

  return (
    <animated.span>
      {spring.val.to(v => `${prefix}${v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`)}
    </animated.span>
  );
}
