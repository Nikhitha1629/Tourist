import React, { useRef, useEffect, useState } from 'react';
import { Col, Form } from 'reactstrap';
import './search-bar.css';

const API_KEY = '100958aa43cf65c344bf45288f080932';

const SearchBar = () => {
  const locationRef = useRef(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(locationRef.current, {
        types: ["(cities)"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place && place.geometry) {
          searchHandler(place.name);
        }
      });
    }
  }, []);

  const fetchWeatherData = async (lat, lon) => {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    return {
      temp: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
    };
  };

  const searchHandler = async (location = locationRef.current.value) => {
    if (location === '') {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        query: `popular places in ${location}`,
        fields: ["name", "geometry", "photos", "place_id", "rating", "formatted_address"],
      };

      service.textSearch(request, async (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const placesWithWeather = await Promise.all(
            results.map(async (place) => {
              if (place.geometry) {
                const weather = await fetchWeatherData(
                  place.geometry.location.lat(),
                  place.geometry.location.lng()
                );
                return { ...place, weather };
              }
              return place;
            })
          );
          setPlaces(placesWithWeather);
        } else {
          setError('No results found. Please try another location.');
        }
        setLoading(false);
      });
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <h2 style={{textAlign:'center',marginBottom:'20px'}}>Enter your Location</h2>
      <Col lg="12">
        <div className="search-bar">
          <Form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              searchHandler();
            }}
          >
            <span className="location-icon">
              <i className="ri-map-pin-fill"></i>
            </span>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Explore places"
                ref={locationRef}
                id="searchInput"
                className="search-input"
              />
            </div>
            <button
              type="button"
              className="search-button"
              onClick={() => searchHandler()}
              aria-label="Search"
            >
              <i className="ri-search-line"></i>
            </button>
          </Form>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}

        <div className="places-list">
          {places.map((place) => (
            <React.Fragment key={place.place_id}>
              <div className="place-card">
                <div className="place-image">
                  <img
                    src={place.photos ? place.photos[0].getUrl() : "/placeholder-image.jpg"}
                    alt={place.name}
                  />
                </div>
                <div className="place-info">
                  <div className="place-header">
                    <h3>{place.name}</h3>
                    {place.rating && (
                      <div className="place-rating">
                        ⭐ {place.rating}
                      </div>
                    )}
                  </div>
                  <p className="place-address">{place.formatted_address}</p>
                  
                  {place.weather && (
                    <div className="dis">
                    <div className="place-weather">
                      <img
                        src={`http://openweathermap.org/img/wn/${place.weather.icon}@2x.png`}
                        alt="weather icon"
                        className="weather-icon"
                      />
                      <div className="weather-info">
                        <span className="weather-main">
                          {place.weather.temp}°C - {place.weather.description}
                        </span>
                        <div className="weather-data">
                          <div className="weather-data-item">
                            <span className="weather-label">Humidity</span>
                            <span>{place.weather.humidity}%</span>
                          </div>
                          <div className="weather-data-item">
                            <span className="weather-label">Pressure</span>
                            <span>{place.weather.pressure} hPa</span>
                          </div>
                          <div className="weather-data-item">
                            <span className="weather-label">Wind Speed</span>
                            <span>{place.weather.windSpeed} m/s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              </div>
              <hr className="place-divider" />
            </React.Fragment>
          ))}
        </div>
      </Col>
    </div>
  );
};

export default SearchBar;
