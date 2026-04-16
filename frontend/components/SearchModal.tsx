import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { FaLocationDot } from "react-icons/fa6";
import { FaSearch } from 'react-icons/fa';
import { Button } from './ui/button';
interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    modalType: string,
    suggestions: any[];
    onSuggestionsFetchRequested: ({ value }: { value: string }) => void;
    onSuggestionsClearRequested: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    modalType,
    suggestions,
    onSuggestionsFetchRequested,
    onSuggestionsClearRequested,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);

    const getSuggestionValue = (suggestion: any) => suggestion.name;

    const renderSuggestion = (suggestion: any) => (
        <div className="cursor-pointer flex justify-start items-center p-2 m-2">
            <FaLocationDot className={`w-[3rem] h-[3rem] text-xl ${modalType == "from" ? "text-red-500" : "text-green-500"} p-2`} />
            <h1 className="text-xl text-slate-500 p-2">{suggestion.name}</h1>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end">
            <div className="bg-white w-full h-full rounded-t-lg p-4">
                <div className="flex justify-end">
                    <Button onClick={onClose} className="text-lg p-4 m-4 bg-red-800">Close</Button>
                </div>

                <div className="relative w-full">
                    {!suggestionsVisible && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="h-5 w-5 text-gray-400" />
                        </div>
                    )}
                    <Autosuggest
                        suggestions={suggestions}
                        onSuggestionsFetchRequested={(request) => {
                            onSuggestionsFetchRequested(request);
                            setSuggestionsVisible(true);
                        }}
                        onSuggestionsClearRequested={() => {
                            onSuggestionsClearRequested();
                            setSuggestionsVisible(false);
                        }}
                        getSuggestionValue={getSuggestionValue}
                        renderSuggestion={renderSuggestion}
                        inputProps={{
                            placeholder: "Search Station",
                            value: inputValue,
                            onChange: (e, { newValue }) => setInputValue(newValue),
                            className: "text-xl w-full border border-gray-300 rounded-lg p-4 pl-10" // Add padding-left for the icon
                        }}
                        onSuggestionSelected={(event, { suggestionValue }) => {
                            onSelect(suggestionValue);
                            onClose();
                        }}
                        renderInputComponent={inputProps => (
                            <div className="relative">
                                <input {...inputProps} />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default SearchModal;