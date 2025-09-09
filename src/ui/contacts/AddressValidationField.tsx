"use client";

import { useGoogleMaps } from "@/providers/GoogleMapsProvider";
import { CheckCircle, Warning } from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldError } from "react-hook-form";

interface AddressValidationFieldProps {
  value: string;
  onChange: (value: string) => void;
  onLocationChange?: (lat: number, lng: number, placeId: string) => void;
  onValidatedAddressChange?: (address: string) => void;
  error?: FieldError;
  label?: string;
  required?: boolean;
  fullWidth?: boolean;
  sx?: any;
}

interface AddressValidation {
  isValid: boolean;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  components?: {
    streetNumber?: string;
    route?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function AddressValidationField({
  value,
  onChange,
  onLocationChange,
  onValidatedAddressChange,
  error,
  label = "Address",
  required = false,
  fullWidth = true,
  sx,
}: AddressValidationFieldProps) {
  const [validation, setValidation] = useState<AddressValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Use the Google Maps provider hook
  const { apiKey, isReady: scriptsLoaded } = useGoogleMaps();

  // Initialize services when scripts are loaded
  useEffect(() => {
    if (scriptsLoaded && window.google?.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (it requires a map or HTMLDivElement)
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [scriptsLoaded]);

  // Parse address components helper
  const parseAddressComponents = (addressComponents: google.maps.GeocoderAddressComponent[]) => {
    const components: AddressValidation["components"] = {};

    addressComponents?.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) {
        components.streetNumber = component.long_name;
      } else if (types.includes("route")) {
        components.route = component.long_name;
      } else if (types.includes("locality")) {
        components.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        components.state = component.short_name;
      } else if (types.includes("country")) {
        components.country = component.short_name;
      } else if (types.includes("postal_code")) {
        components.postalCode = component.long_name;
      }
    });

    return components;
  };

  // Fetch place details when a suggestion is selected
  const fetchPlaceDetails = useCallback(
    (placeId: string) => {
      if (!placesService.current) return;

      setIsValidating(true);

      const request = {
        placeId,
        fields: ["formatted_address", "geometry", "address_components", "place_id"],
        sessionToken: sessionToken.current || undefined,
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const lat = place.geometry?.location?.lat() || 0;
          const lng = place.geometry?.location?.lng() || 0;
          const formattedAddress = place.formatted_address || "";
          const components = parseAddressComponents(place.address_components || []);

          const validationResult: AddressValidation = {
            isValid: true,
            formattedAddress,
            lat,
            lng,
            placeId,
            components,
          };

          setValidation(validationResult);
          onValidatedAddressChange?.(formattedAddress);
          onLocationChange?.(lat, lng, placeId);

          // Create a new session token for the next search
          sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        }
        setIsValidating(false);
      });
    },
    [onLocationChange, onValidatedAddressChange],
  );

  // Fetch autocomplete predictions
  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || !input) {
      setOptions([]);
      return;
    }

    setLoading(true);

    const request = {
      input,
      types: ["address"],
      componentRestrictions: { country: ["us", "ca", "mx", "gb", "ie"] },
      sessionToken: sessionToken.current || undefined,
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setOptions(
          predictions.map((prediction) => ({
            description: prediction.description,
            place_id: prediction.place_id,
            structured_formatting: prediction.structured_formatting,
          })),
        );
      } else {
        setOptions([]);
      }
      setLoading(false);
    });
  }, []);

  // Debounce the fetch predictions
  useEffect(() => {
    if (!scriptsLoaded) return;

    const timer = setTimeout(() => {
      if (inputValue && inputValue.length > 2) {
        fetchPredictions(inputValue);
      } else {
        setOptions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, fetchPredictions, scriptsLoaded]);

  // Handle input change
  const handleInputChange = (event: any, newInputValue: string) => {
    setInputValue(newInputValue);
    onChange(newInputValue);

    // Clear validation if user is typing (not selecting from dropdown)
    if (event?.type === "change") {
      setValidation(null);
    }
  };

  // Handle option selection
  const handleChange = (event: any, newValue: PlacePrediction | string | null) => {
    if (typeof newValue === "object" && newValue?.place_id) {
      // User selected an option from the dropdown
      setInputValue(newValue.description);
      onChange(newValue.description);
      fetchPlaceDetails(newValue.place_id);
    } else if (typeof newValue === "string") {
      // User typed custom text
      setInputValue(newValue);
      onChange(newValue);
      setValidation(null);
    }
  };

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  if (!apiKey) {
    return (
      <TextField
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        label={label}
        required={required}
        fullWidth={fullWidth}
        error={!!error}
        helperText={error?.message || "Google Maps API key not configured"}
        sx={sx}
      />
    );
  }

  return (
    <Box sx={sx}>
      <Autocomplete
        freeSolo
        options={options}
        loading={loading}
        value={inputValue}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        getOptionLabel={(option) => {
          if (typeof option === "string") {
            return option;
          }
          return option.description;
        }}
        renderOption={(props, option) => {
          if (typeof option === "string") {
            return <li {...props}>{option}</li>;
          }
          return (
            <li {...props}>
              <Box>
                <Typography variant="body2">{option.structured_formatting.main_text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.structured_formatting.secondary_text}
                </Typography>
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={!!error}
            helperText={error?.message}
            placeholder="Start typing an address..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading || isValidating ? <CircularProgress size={20} /> : null}
                  {validation?.isValid && <CheckCircle color="success" sx={{ ml: 1 }} />}
                  {validation && !validation.isValid && <Warning color="warning" sx={{ ml: 1 }} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        fullWidth={fullWidth}
        filterOptions={(x) => x} // Don't filter options, let Google handle it
        autoComplete
        includeInputInList
        disablePortal={false}
        sx={{
          "& .MuiAutocomplete-popper": {
            zIndex: 9999, // Ensure dropdown appears above dialogs
          },
        }}
      />

      {/* Validation Status */}
      {validation && (
        <Box sx={{ mt: 2 }}>
          {validation.isValid ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                ✓ Address Verified
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {validation.formattedAddress}
              </Typography>
              {validation.components && (
                <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {validation.components.city && (
                    <Chip size="small" label={validation.components.city} />
                  )}
                  {validation.components.state && (
                    <Chip size="small" label={validation.components.state} />
                  )}
                  {validation.components.postalCode && (
                    <Chip size="small" label={validation.components.postalCode} />
                  )}
                  {validation.placeId && (
                    <Chip
                      size="small"
                      label={`Place ID: ${validation.placeId.substring(0, 10)}...`}
                      title={validation.placeId}
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
            </Alert>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                Address not verified. You can still use this address, but it hasn&apos;t been
                validated against Google Places.
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
