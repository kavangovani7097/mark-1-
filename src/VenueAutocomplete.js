import { useEffect, useRef } from 'react';

const MAPS_SCRIPT_ID = 'google-maps-places-script';
const MAPS_SCRIPT_URL =
  'https://maps.googleapis.com/maps/api/js?key=AIzaSyA0Sr7npoE5MGMk9LzA4CWFGL-c-foQ30s&libraries=places';

let mapsScriptPromise;

function loadMapsScript() {
  if (window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }

  if (mapsScriptPromise) {
    return mapsScriptPromise;
  }

  mapsScriptPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        resolve();
      } else {
        mapsScriptPromise = null;
        reject(new Error('Google Maps Places library unavailable'));
      }
    };

    const existingScript = document.getElementById(MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', finish, { once: true });
      existingScript.addEventListener(
        'error',
        () => {
          mapsScriptPromise = null;
          reject(new Error('Google Maps script failed to load'));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.src = MAPS_SCRIPT_URL;
    script.async = true;
    script.onload = finish;
    script.onerror = () => {
      mapsScriptPromise = null;
      reject(new Error('Google Maps script failed to load'));
    };
    document.head.appendChild(script);
  });

  return mapsScriptPromise;
}

function VenueAutocomplete({
  value,
  onVenueChange,
  onAddressChange,
  onCoordsChange,
  placeholder = 'Where are you playing?',
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadMapsScript()
      .then(() => {
        if (cancelled || !inputRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            fields: ['name', 'formatted_address', 'geometry'],
            componentRestrictions: { country: 'in' },
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          onVenueChange(place.name || inputRef.current?.value || '');
          onAddressChange(place.formatted_address || '');

          const location = place.geometry?.location;
          if (location && onCoordsChange) {
            onCoordsChange({
              lat: location.lat(),
              lng: location.lng(),
            });
          }
        });

        autocompleteRef.current = autocomplete;
      })
      .catch((error) => {
        console.error('Venue autocomplete failed to initialize:', error);
      });

    return () => {
      cancelled = true;
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(
          autocompleteRef.current
        );
        autocompleteRef.current = null;
      }
    };
  }, [onVenueChange, onAddressChange, onCoordsChange]);

  useEffect(() => {
    if (!value && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [value]);

  const handleInput = (event) => {
    onVenueChange(event.target.value);
    onAddressChange('');
    if (onCoordsChange) {
      onCoordsChange(null);
    }
  };

  return (
    <div className="venue-autocomplete">
      <input
        ref={inputRef}
        type="text"
        className="login__input venue-autocomplete__input"
        placeholder={placeholder}
        onInput={handleInput}
        autoComplete="off"
      />
    </div>
  );
}

export default VenueAutocomplete;
