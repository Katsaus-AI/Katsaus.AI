/**
 * Application header component with Firestore integration.
 * 
 * Features:
 * - Displays organization name (fetched from Firestore)
 * - View mode toggle buttons (viewing mode, fullscreen)
 * - Current date/time display
 * - User-editable company name input (for demo purposes)
 * 
 * Firestore Integration:
 * - Collection: 'companies'
 * - Document ID: 'F0yv6ZOuJT8g4Lfc9xyG' (hardcoded demo company)
 * - Field: 'company_name'
 * - Fetched once on component mount
 * 
 * Error Handling:
 * Provides user-friendly error messages for common Firestore issues:
 * - 'permission-denied': Firestore security rules block access
 * - 'unavailable': Firestore service is unreachable
 * - Other errors: Displays error code for debugging
 * 
 * Note: The hardcoded document ID is for demo/prototype purposes.
 * In production, this should be dynamic or configured via environment variables.
 */

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Header component with company info and controls.
 * 
 * @param {Object} props
 * @param {Object} props.dateTime - Current time and date {time: string, date: string}
 * @param {Function} props.onToggleViewingMode - Toggle presentation mode
 * @param {Function} props.onToggleFullscreen - Toggle fullscreen mode
 * @param {boolean} props.adminMode - Current admin mode state (unused in component but may be needed for future features)
 * @param {Function} props.onToggleAdminMode - Toggle admin mode (unused in component but may be needed for future features)
 */
export function Header({ dateTime, onToggleViewingMode, onToggleFullscreen, adminMode, onToggleAdminMode }) {
  // Company name state, initially shows loading indicator
  const [companyName, setCompanyName] = useState('Ladataan...');

  /**
   * Fetch company name from Firestore on component mount.
   * 
   * Firestore query details:
   * - Path: /companies/F0yv6ZOuJT8g4Lfc9xyG
   * - Field: company_name
   * 
   * Why hardcoded document ID?
   * This is a demo/prototype implementation. The document ID represents
   * a specific test/demo company in the Firestore database.
   * 
   * Lifecycle:
   * - Runs once on mount (empty dependency array)
   * - Uses cancellation token to prevent state updates after unmount
   * 
   * Error states:
   * - Document not found: "Ei löytynyt"
   * - Permission denied: "Luku estetty (rules)" 
   * - Network error: "Firestore ei tavoitettavissa"
   * - Other errors: "Virhe: {error.code}" or "Virhe haussa"
   */
  useEffect(() => {
    let cancelled = false;

    const fetchCompanyName = async () => {
      try {
        // Reference to specific company document (hardcoded for demo)
        const ref = doc(db, 'companies', 'F0yv6ZOuJT8g4Lfc9xyG');
        const snap = await getDoc(ref);

        // Prevent state update if component unmounted during fetch
        if (cancelled) return;
        
        // Handle document not found
        if (!snap.exists()) {
          setCompanyName('Ei löytynyt');
          return;
        }

        // Extract company_name field from document
        const data = snap.data();
        setCompanyName(data.company_name || 'Ei nimeä');
      } catch (error) {
        console.error('Firestore fetch failed:', error);
        if (cancelled) return;
        
        // Provide user-friendly error messages based on error code
        const code = error?.code || '';
        if (code === 'permission-denied') {
          setCompanyName('Luku estetty (rules)');
          return;
        }
        if (code === 'unavailable') {
          setCompanyName('Firestore ei tavoitettavissa');
          return;
        }
        setCompanyName(code ? `Virhe: ${code}` : 'Virhe haussa');
      }
    };

    fetchCompanyName();

    // Cleanup: mark request as cancelled to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, []); // Empty dependency array: run only once on mount

  return (
    <header className="app-header">
      {/* Static logo text (placeholder) */}
      <span className="app-logo">Firma Oy</span>
      
      {/* Viewing mode toggle: Hides admin controls for presentations */}
      <button
        type="button"
        className="viewing-mode-btn"
        aria-label="Katselutila"
        onClick={onToggleViewingMode}
      >
        👁
      </button>
      
      {/* Fullscreen toggle: Expands all messages and enters browser fullscreen */}
      <button
        type="button"
        className="fullscreen-btn"
        aria-label="Fullscreen-näkymä"
        onClick={onToggleFullscreen}
      >
        ⛶
      </button>
      
      {/* 
        Company name input field (editable for demo purposes).
        
        Note: This is currently a client-side only input. Changes are NOT
        persisted to Firestore or localStorage. If persistence is needed,
        add onChange handler that calls a save function.
        
        The input allows users to see and temporarily modify the company name
        fetched from Firestore, which can be useful for testing different
        organization names in the UI.
      */}
      <input
        type="text"
        className="company-name-input"
        aria-label="Yrityksen nimi Firestoresta"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />
      
      {/* Current time and date display (updates every minute) */}
      <div className="header-time">
        <span className="time">{dateTime.time}</span>
        <span className="date">{dateTime.date}</span>
      </div>
    </header>
  );
}
