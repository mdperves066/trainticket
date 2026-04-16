import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface Route {
  source_name: string;
  destination_name: string;
  distance: number;
}

interface TrainRouteGraphProps {
  routes: Route[];
}

const TrainRouteGraph: React.FC<TrainRouteGraphProps> = ({ routes }) => {
  return (
    <div className="p-4">
      {routes.map((route, index) => (
        <div key={index} className="flex items-center mb-8 p-4 overflow-x-auto">
          <FaMapMarkerAlt className="text-red-500 w-6 h-6" />
          <p className="ml-2 text-xs md:text-lg font-semibold">{route.source_name}</p>
          <div className="flex-1 mx-4">
            <svg width="100%" height="100" viewBox="0 0 200 50" preserveAspectRatio="xMidYMid meet">
              <path
                d="M 0 35 Q 50 10, 100 35 T 200 35"
                stroke="black"
                strokeWidth="2"
                fill="transparent"
              />
              <text x="100" y="10" textAnchor="middle" fontSize="13" fill="black">
                {route.distance} km
              </text>
            </svg>
          </div>
          <FaMapMarkerAlt className="text-green-500 w-6 h-6" />
          <p className="ml-2 text-xs md:text-lg font-semibold">{route.destination_name}</p>
        </div>
      ))}
    </div>
  );
};

export default TrainRouteGraph;