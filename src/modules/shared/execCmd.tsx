import { execFile } from "child_process";

// ejecutar sin shell: los argumentos se pasan tal cual y no se interpretan
export async function execCmd(file: string, args: string[]) {
	return new Promise((resolve, reject) => {
		execFile(file, args, (err, stdout, stderr) => {
			if (err) reject({ err, stderr });
			else resolve({ stdout, stderr });
		});
	});
}
