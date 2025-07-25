import os

def extract_vulnerabilities(json_data, base_scan_path):
    vulnerabilities = []
    base_scan_path = os.path.abspath(base_scan_path).replace("\\", "/")

    for dependency in json_data.get("dependencies", []):
        file_name = dependency.get("fileName", "Unknown")
        full_file_path = dependency.get("filePath", "Unknown")

        # ✅ Get version from evidence or package ID
        version = "Unknown"

        # First try evidenceCollected
        evidence_versions = dependency.get("evidenceCollected", {}).get("versionEvidence", [])
        if evidence_versions:
            version = evidence_versions[0].get("value", "Unknown")

        # If still not found, try packages list
        if version == "Unknown":
            for pkg in dependency.get("packages", []):
                pkg_id = pkg.get("id", "")
                if "@" in pkg_id:
                    version = pkg_id.split("@")[-1]
                    break

        # Normalize and trim path
        if full_file_path:
            normalized_path = os.path.abspath(full_file_path).replace("\\", "/")
            if normalized_path.startswith(base_scan_path):
                relative_path = os.path.relpath(normalized_path, base_scan_path).replace("\\", "/")
            else:
                relative_path = normalized_path
        else:
            relative_path = "Unknown"

        # ✅ Get vulnerabilities
        for vuln in dependency.get("vulnerabilities", []):
            raw_name = vuln.get("name", "Unknown")
            severity = vuln.get("severity", "Unknown")

            # Handle description (some are empty strings)
            description = vuln.get("description", "").strip()
            if not description:
                description = "No description provided."
            else:
                description = description[:1000]

            # Get CVE ID
            cve_id = raw_name if raw_name.startswith("CVE-") else "N/A"

            vulnerabilities.append({
                "file": file_name,
                "path": relative_path,
                "version": version,
                "cve_id": cve_id,
                "severity": severity,
                "description": description
            })

    return vulnerabilities
