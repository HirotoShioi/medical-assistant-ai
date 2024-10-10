import ms from './medicines.json';
import { ratio } from 'fuzzball';

type Medicine = {
	medicine_name: string;
	generic_name: string;
	url: string;
};

const medicines: Map<string, Medicine> = new Map();

ms.forEach((medicine) => {
	medicines.set(medicine.medicine_name, {
		medicine_name: medicine.medicine_name,
		generic_name: medicine.generic_name,
		url: medicine.url,
	});
});

const THRESHOLD = 70;
const MAX_RESULTS = 5;
function getMedicineInfo(medicineName: string): Medicine[] {
	const lowerMedicineName = medicineName.toLowerCase();
	let medicineInfos: Medicine[] = [];
	for (const medicine of medicines.values()) {
		if (medicineInfos.length >= MAX_RESULTS) break;
		const targetMedicineName = medicine.medicine_name.toLowerCase();
		const targetGenericName = medicine.generic_name.toLowerCase();
		if (targetMedicineName.includes(lowerMedicineName) || targetGenericName.includes(lowerMedicineName)) {
			medicineInfos.push(medicine);
			break;
		} else if (ratio(medicine.medicine_name, lowerMedicineName) >= THRESHOLD || ratio(medicine.generic_name, lowerMedicineName) >= THRESHOLD) {
			medicineInfos.push(medicine);
		}
	}
	return medicineInfos;
}

export { getMedicineInfo };
