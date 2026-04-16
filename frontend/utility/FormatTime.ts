const FormatTime = (timeString: string) => {
    let [hours, minutes] = timeString.split(':');
    let period = 'AM';

    let hourNumber = parseInt(hours, 10);
    if (hourNumber >= 12) {
        period = 'PM';
        if (hourNumber > 12) {
            hourNumber -= 12;
        }
    } else if (hourNumber === 0) {
        hourNumber = 12;
    }

    return `${hourNumber.toString().padStart(2, '0')}:${minutes} ${period}`;
};

export default FormatTime;