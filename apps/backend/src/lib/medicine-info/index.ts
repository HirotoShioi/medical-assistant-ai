import ms from './medicines.json';

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

function getMedicineInfo(medicineName: string): Medicine[] {
	let medicineInfos: Medicine[] = [];
	for (const [_, medicine] of medicines.entries()) {
		if (medicine.medicine_name.includes(medicineName) || medicine.generic_name.includes(medicineName)) {
			medicineInfos.push(medicine);
		}
	}
	return medicineInfos;
}

export { getMedicineInfo };
