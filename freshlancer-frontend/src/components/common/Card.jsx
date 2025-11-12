import React from 'react';

const Card = ({ children, className = '', title, actions }) => {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
