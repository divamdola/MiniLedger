import { createElement } from 'react';

export default function DateField({ value, onChange }) {
  return createElement('input', {
    'aria-label': 'Due date',
    type: 'date',
    value,
    onChange: (event) => onChange(event.target.value),
    style: inputStyle,
  });
}

const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  height: 54,
  borderRadius: 7,
  border: '1px solid #E5E3D9',
  backgroundColor: '#FFFEFA',
  padding: '0 15px',
  color: '#20342D',
  fontSize: 16,
  cursor: 'pointer',
};