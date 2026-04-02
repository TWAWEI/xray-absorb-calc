#!/usr/bin/env python3
"""Export xraydb data to JSON files for the frontend."""

import json
import os

import xraydb


def export_elements():
    """Export element basic data: Z, symbol, name, atomic_mass."""
    elements = []
    for z in range(1, 99):  # H(1) to Cf(98)
        sym = xraydb.atomic_symbol(z)
        name = xraydb.atomic_name(z)
        mass = xraydb.atomic_mass(z)
        elements.append({
            "Z": z,
            "symbol": sym,
            "name": name,
            "atomic_mass": round(mass, 6),
        })
    return elements


def export_edges():
    """Export absorption edge energies per element."""
    edges = {}
    for z in range(1, 99):
        sym = xraydb.atomic_symbol(z)
        element_edges = []
        for edge_name in xraydb.xray_edges(z):
            edge = xraydb.xray_edge(z, edge_name)
            if edge is not None and edge.energy > 0:
                element_edges.append({
                    "edge": edge_name,
                    "energy_eV": round(edge.energy, 2),
                    "fluorescence_yield": round(edge.fyield, 6),
                })
        if element_edges:
            edges[sym] = element_edges
    return edges


def export_fluorescence():
    """Export fluorescence line energies and intensities per element."""
    fluor = {}
    for z in range(1, 99):
        sym = xraydb.atomic_symbol(z)
        element_lines = []
        for edge_name in ('K', 'L1', 'L2', 'L3', 'M1', 'M2', 'M3', 'M4', 'M5'):
            try:
                lines = xraydb.xray_lines(z, edge_name)
            except (ValueError, KeyError):
                continue
            if lines is None:
                continue
            for line_name, line_data in lines.items():
                if line_data.intensity > 0.001:
                    element_lines.append({
                        "line": line_name,
                        "energy_eV": round(line_data.energy, 2),
                        "intensity": round(line_data.intensity, 6),
                        "initial_level": line_data.initial_level,
                        "final_level": line_data.final_level,
                    })
        if element_lines:
            element_lines.sort(key=lambda x: x["energy_eV"])
            fluor[sym] = element_lines
    return fluor


def export_mu_data():
    """Export mass attenuation coefficient tables per element."""
    import numpy as np

    mu_data = {}
    base_energies = np.logspace(2, 6, 300)  # 100 eV to 1,000,000 eV

    for z in range(1, 99):
        sym = xraydb.atomic_symbol(z)

        edge_energies = []
        for edge_name in xraydb.xray_edges(z):
            edge = xraydb.xray_edge(z, edge_name)
            if edge is not None and edge.energy > 0:
                edge_energies.append(edge.energy)

        extra_energies = []
        for e in edge_energies:
            if e > 101:
                extra_energies.append(e - 1.0)
            if e < 999999:
                extra_energies.append(e + 1.0)

        all_energies = np.unique(
            np.concatenate([base_energies, extra_energies])
        )
        all_energies = all_energies[
            (all_energies >= 100) & (all_energies <= 1e6)
        ]
        all_energies.sort()

        try:
            mus = xraydb.mu_elam(z, all_energies)
            data_points = []
            for energy, mu in zip(all_energies, mus):
                if mu > 0:
                    data_points.append({
                        "energy_eV": round(float(energy), 2),
                        "mu_over_rho": round(float(mu), 6),
                    })
        except Exception:
            data_points = []

        mu_data[sym] = {
            "symbol": sym,
            "edges": sorted([round(e, 2) for e in edge_energies]),
            "data": data_points,
        }
    return mu_data


def write_json(data, filepath):
    """Write data to a JSON file with compact formatting."""
    with open(filepath, 'w') as f:
        json.dump(data, f, separators=(',', ':'))


def main():
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)

    print("Exporting elements...")
    elements = export_elements()
    write_json(elements, os.path.join(data_dir, 'elements.json'))
    print(f"  {len(elements)} elements")

    print("Exporting edges...")
    edges = export_edges()
    write_json(edges, os.path.join(data_dir, 'edges.json'))
    print(f"  {len(edges)} elements with edges")

    print("Exporting fluorescence lines...")
    fluor = export_fluorescence()
    write_json(fluor, os.path.join(data_dir, 'fluorescence.json'))
    print(f"  {len(fluor)} elements with lines")

    print("Exporting mu data...")
    mu_data = export_mu_data()
    write_json(mu_data, os.path.join(data_dir, 'mu-data.json'))
    print(f"  {len(mu_data)} elements with mu data")

    print("\nFile sizes:")
    for fname in ['elements.json', 'edges.json', 'fluorescence.json', 'mu-data.json']:
        fpath = os.path.join(data_dir, fname)
        size = os.path.getsize(fpath)
        print(f"  {fname}: {size / 1024:.1f} KB")

    print("\nDone!")


if __name__ == '__main__':
    main()
