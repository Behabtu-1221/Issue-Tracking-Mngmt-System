import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';

/**
 * Standardized Enterprise Action Button Component
 * Production-ready, pixel-perfect action icon button with balanced harmonic contrast,
 * unified touch target geometry, and full keyboard/screen-reader accessibility.
 *
 * @param {'edit' | 'delete' | 'view' | 'neutral' | 'warning' | 'success' | 'primary' | 'danger'} variant
 * @param {React.ReactNode} icon Custom icon override (defaults to standard icon for variant)
 * @param {string} label Optional text label to render as a pill button
 * @param {'sm' | 'md'} size Size variant ('md' = 32px, 'sm' = 28px)
 * @param {string} title Accessible tooltip & aria-label
 * @param {function} onClick Click event handler
 * @param {boolean} disabled Disabled state flag
 * @param {string} className Additional CSS classes
 * @param {object} style Additional inline styles
 */
export const ActionButton = ({
  variant = 'neutral',
  icon,
  label,
  size = 'md',
  title,
  onClick,
  disabled = false,
  className = '',
  style = {},
  type = 'button',
  ...rest
}) => {
  // Normalize variant class mapping
  let variantClass = 'action-btn-neutral';
  let DefaultIcon = null;

  switch (variant) {
    case 'edit':
    case 'primary':
      variantClass = 'action-btn-edit';
      DefaultIcon = Edit2;
      break;
    case 'delete':
    case 'danger':
      variantClass = 'action-btn-delete';
      DefaultIcon = Trash2;
      break;
    case 'view':
    case 'indigo':
      variantClass = 'action-btn-view';
      DefaultIcon = Eye;
      break;
    case 'warning':
      variantClass = 'action-btn-warning';
      break;
    case 'success':
      variantClass = 'action-btn-success';
      break;
    case 'neutral':
    default:
      variantClass = 'action-btn-neutral';
      break;
  }

  const iconSize = size === 'sm' ? 13 : 14;

  const renderIcon = () => {
    if (icon) {
      // If icon is a React element (e.g. <Edit size={14} />)
      if (React.isValidElement(icon)) {
        return icon;
      }
      // If icon is a component constructor (e.g. Edit)
      const IconComp = icon;
      return <IconComp size={iconSize} />;
    }
    if (DefaultIcon) {
      return <DefaultIcon size={iconSize} />;
    }
    return null;
  };

  const classes = [
    'action-btn',
    variantClass,
    label ? 'action-btn-pill' : '',
    size === 'sm' ? 'action-btn-sm' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={title || label}
      style={style}
      {...rest}
    >
      {renderIcon()}
      {label && <span>{label}</span>}
    </button>
  );
};

/**
 * ActionGroup container to guarantee consistent layout, spacing, and alignment
 * across tables, cards, and list views.
 */
export const ActionGroup = ({
  children,
  className = '',
  style = {},
  align = 'right',
  ...rest
}) => {
  const justify = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';

  return (
    <div
      className={`action-btn-group ${className}`}
      style={{ justifyContent: justify, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default ActionButton;
