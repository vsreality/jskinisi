import { createContext } from 'react';

// The context object lives in its own module so that ControllerProvider.jsx
// exports only a component. Mixing component and non-component exports in one
// file breaks React Fast Refresh (see react-refresh/only-export-components).
export const ControllerContext = createContext();

export default ControllerContext;
