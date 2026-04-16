import FormatTime from '@/utility/FormatTime';
import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';


export default function SearchTrainRouteGraph({ path }: any) {
    return (
        <div className="p-4">
            {path.map((route: any, index: any) => (
                <div key={index} className="flex items-center mb-4 md:mb-8 p-1 md:p-4 overflow-x-auto">
                    <div className='flex flex-col justify-center items-center md:mx-6'>
                        <FaMapMarkerAlt className="text-red-500 w-5 md:w-7 h-5 md:h-7" />
                        <p className="text-slate-500 md:ml-2 text-xs md:text-lg font-semibold">{route.source_name}</p>
                        <p className="md:ml-2 text-xs md:text-lg md:font-semibold">Departure: {FormatTime(route.leavetime)}</p>
                    </div>
                    <div className="flex-1 md:mx-4 md:mb-4">
                        <svg width="100%" height="80" viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet">
                            <line
                                x1="0"
                                y1="33"
                                x2="200"
                                y2="33"
                                stroke="black"
                                strokeWidth="2"
                            />
                            <text x="100" y="25" textAnchor="middle" fill="slate" style={{ fontSize: '20px' }}>
                                {route.distance} km
                            </text>
                            <text x="100" y="55" textAnchor="middle" fill="slate" style={{ fontSize: '20px' }}>
                                {route.duration} minutes
                            </text>
                            <style jsx>{`
                                @media (min-width: 768px) {
                                    text {
                                        font-size: 8px;
                                    }
                                }
                            `}</style>
                        </svg>
                    </div>

                    <div className='flex flex-col justify-center items-center md:mx-6'>
                        <FaMapMarkerAlt className="text-green-500 w-5 md:w-7 h-5 md:h-7" />
                        <p className="text-slate-500 md:ml-2 text-xs md:text-lg font-semibold">{route.destination_name}</p>
                        <p className="md:ml-2 text-xs md:text-lg md:font-semibold">Reach: {FormatTime(route.reachtime)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
