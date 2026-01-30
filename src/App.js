import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip } from "react-leaflet";
import { Routes, Route, Link } from "react-router-dom";
import "react-image-gallery/styles/css/image-gallery.css";
import About from "./About";
import Partners from "./Partners";
import Impact from "./Impact";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMediaQuery } from "react-responsive";

import staticDataRaw from "./data_cleaned.json";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Waste Weight Function
const getWasteWeight = (quantity) => {
  switch (quantity) {
    case "below_500_kg":
      return 3.5;
    case "some_100_kg":
      return 1;
    case "_500kg_1_tonne":
      return 7.5;
    case "above_1_tonne":
      return 10;
    default:
      return 0;
  }
};

// Waste Type Map
const wasteTypeToColumnMap = {
  "Organic & Wet": "Organic and Wet Waste",
  "Plastic Paper": "Plastic Paper Glass Waste",
  "Sanitary & Hazardous": "Sanitary and Hazardous Waste",
  "Battery & Bulb": "Battery and Bulb Waste",
  "Construction & Demolition": "Construction and Demolition Waste",
  Clothes: "Clothes Waste",
  Carcasses: "Carcasses Waste",
  Others: "Others",
};

// Calculate Pie Data
const calculateWasteTypeCounts = (data) => {
  const counts = {};
  Object.keys(wasteTypeToColumnMap).forEach((type) => (counts[type] = 0));

  data.forEach((row) => {
    Object.entries(wasteTypeToColumnMap).forEach(([type, column]) => {
      if (row[column] === 1) counts[type] += 1;
    });
  });

  return Object.keys(counts)
    .filter((key) => counts[key] > 0)
    .map((key) => ({ name: key, value: counts[key] }));
};

// Calculate Pie Data for single row
const calculatePieForRow = (row) => {
  return Object.entries(wasteTypeToColumnMap)
    .filter(([type, column]) => row[column] === 1)
    .map(([type]) => ({ name: type, value: 1 }));
};

// Custom Labels for Pie
const renderCustomizedLabel = (isSmallScreen) => (props) => {
  const {
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  } = props;

  const RADIAN = Math.PI / 180;

  const labelRadius = outerRadius + (isSmallScreen ? 45 : 35);

  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

  const percentage = (percent * 100).toFixed(1);

  if (name.includes(" & ")) {
    const [prefix, suffix] = name.split(" & ");
    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={isSmallScreen ? 9 : 14}
      >
        <tspan x={x} dy="-0.6em">{prefix} &</tspan>
        <tspan x={x} dy="1.2em">{suffix} {percentage}%</tspan>
      </text>
    );
  } else {
    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={isSmallScreen ? 9 : 14}
      >
        {`${name} ${percentage}%`}
      </text>
    );
  }
};

// Compact Tooltip Content Component
const TooltipContent = ({ row }) => {
  const getValue = (...keys) => {
    for (const key of keys) {
      const v = row[key];
      if (v != null && v !== "" && String(v).trim().toLowerCase() !== "n_a") {
        return String(v).trim().replace(/\r|\n/g, " ");
      }
    }
    return "N/A";
  };

  return (
    <div style={{ lineHeight: "1.25", fontSize: "12px", margin: 0, padding: 0 }}>
      {/* GVP Information */}
      <strong style={{ display: "block", margin: 0, padding: 0 }}>GVP Information</strong>
      <div style={{ margin: 0, padding: 0 }}>Ward: {row["GVP Ward"] ?? "N/A"}</div>
      <div style={{ margin: 0, padding: 0 }}>Nearest Location: {getValue("Nearest Location", "Nearest_Landmark_nearby_GVP")}</div>
      <div style={{ margin: 0, padding: 0 }}>In What Setting is GVP Present: {categorizeLocation(getValue("In_what_setting_is_the_GVP_pre", "Kindly_specify_the_area", "Location Type"))}</div>

      {/* Waste Type */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Waste Type:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row["Organic and Wet Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Organic and Wet Waste</li>}
        {row["Plastic Paper Glass Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Plastic Paper Glass Waste</li>}
        {row["Sanitary and Hazardous Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Sanitary and Hazardous Waste</li>}
        {row["Battery and Bulb Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Battery and Bulb Waste</li>}
        {row["Construction and Demolition Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Construction and Demolition Waste</li>}
        {row["Clothes Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Clothes Waste</li>}
        {row["Carcasses Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Carcasses Waste</li>}
        {row["Others"] === 1 && <li style={{ margin: 0, padding: 0 }}>Others</li>}
        {!(
          row["Organic and Wet Waste"] === 1 ||
          row["Plastic Paper Glass Waste"] === 1 ||
          row["Sanitary and Hazardous Waste"] === 1 ||
          row["Battery and Bulb Waste"] === 1 ||
          row["Construction and Demolition Waste"] === 1 ||
          row["Clothes Waste"] === 1 ||
          row["Carcasses Waste"] === 1 ||
          row["Others"] === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Information Shared by Citizens */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Information Shared by Citizens</strong>
      <div style={{ margin: 0, padding: 0 }}>Has The Civic Authority Conducted Any Awareness Session: {getValue("Civic Authority Conduct Any Session", "Have_the_civic_authorities_con")}</div>
      <div style={{ margin: 0, padding: 0 }}>Have Interviewees Complained to Authorities: {getValue("Have Interviewees Complained to Authority", "Have_you_complained_to_the_aut")}</div>
      <div style={{ margin: 0, padding: 0 }}>If Yes How Was Your Experience: {getValue("If Yes How Was Your Experience ", "If_yes_how_was_your_experienc")}</div>
      <div style={{ margin: 0, padding: 0 }}>How Often is Waste Spotted: {getValue("Notice Frequency", "How_frequently_do_you_notice_g")}</div>
      <div style={{ margin: 0, padding: 0 }}>Where Interviewee Disposes Their Waste: {getValue("Where Interviewee Dispose Their Waste", "Where_do_you_dispose_off_your_")}</div>

      {/* Who disposes The Waste */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Who disposes The Waste:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.dispose_households === 1 && <li style={{ margin: 0, padding: 0 }}>Households</li>}
        {row.dispose_vendors === 1 && <li style={{ margin: 0, padding: 0 }}>Vendors</li>}
        {row.dispose_people_outside === 1 && <li style={{ margin: 0, padding: 0 }}>People from Outside</li>}
        {row.dispose_passing_crowd === 1 && <li style={{ margin: 0, padding: 0 }}>Passing Crowd</li>}
        {row.dispose_others === 1 && <li style={{ margin: 0, padding: 0 }}>Others</li>}
        {!(
          row.dispose_households === 1 ||
          row.dispose_vendors === 1 ||
          row.dispose_people_outside === 1 ||
          row.dispose_passing_crowd === 1 ||
          row.dispose_others === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Gender */}
      {(getValue("No of Women", "group_ya6xw95_row/group_ya6xw95_row_column") !== "N/A" ||
        getValue("No of Men", "group_ya6xw95_row/group_ya6xw95_row_column_1") !== "N/A") && (
        <div>
          <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Gender:</strong>
          <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
            {getValue("No of Women", "group_ya6xw95_row/group_ya6xw95_row_column") !== "N/A" && (
              <li style={{ margin: 0, padding: 0 }}>Women: {getValue("No of Women", "group_ya6xw95_row/group_ya6xw95_row_column")}</li>
            )}
            {getValue("No of Men", "group_ya6xw95_row/group_ya6xw95_row_column_1") !== "N/A" && (
              <li style={{ margin: 0, padding: 0 }}>Men: {getValue("No of Men", "group_ya6xw95_row/group_ya6xw95_row_column_1")}</li>
            )}
          </ul>
        </div>
      )}

      {/* Reasons For Waste Accumulation */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Reasons For Waste Accumulation:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.reason_no_collection === 1 && <li style={{ margin: 0, padding: 0 }}>No Regular Collection Vehicle</li>}
        {row.reason_random_people === 1 && <li style={{ margin: 0, padding: 0 }}>Random People Throwing Garbage</li>}
        {row.reason_user_fee === 1 && <li style={{ margin: 0, padding: 0 }}>Due To User Fee</li>}
        {row.reason_vehicle_time === 1 && <li style={{ margin: 0, padding: 0 }}>Mismatch of Vehicle Time</li>}
        {row.reason_narrow_road === 1 && <li style={{ margin: 0, padding: 0 }}>Due to Narrow Road</li>}
        {row.reason_market_vendors === 1 && <li style={{ margin: 0, padding: 0 }}>Because of Market and Street Vendors</li>}
        {!(
          row.reason_no_collection === 1 ||
          row.reason_random_people === 1 ||
          row.reason_user_fee === 1 ||
          row.reason_vehicle_time === 1 ||
          row.reason_narrow_road === 1 ||
          row.reason_market_vendors === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Does Waste Get Cleared Off */}
      <div style={{ marginTop: "6px", margin: 0, padding: 0 }}>Does Waste Get Cleared Off: {getValue("Does Waste Clear Off", "Does_waste_get_cleared_off_fro")}</div>
      {getValue("When Waste Cleared Off", "If_yes_when_does_the_waste_ge") !== "N/A" && (
        <div style={{ margin: 0, padding: 0 }}>When Waste Cleared Off: {getValue("When Waste Cleared Off", "If_yes_when_does_the_waste_ge")}</div>
      )}

      {/* Problems Faced */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Problems Faced:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.problem_bad_odour === 1 && <li style={{ margin: 0, padding: 0 }}>Bad Odour</li>}
        {row.problem_mosquitos === 1 && <li style={{ margin: 0, padding: 0 }}>Mosquitos</li>}
        {row.problem_stray_animals === 1 && <li style={{ margin: 0, padding: 0 }}>Stray Animals</li>}
        {row.problem_congestion === 1 && <li style={{ margin: 0, padding: 0 }}>Congestion</li>}
        {row.problem_other === 1 && <li style={{ margin: 0, padding: 0 }}>Other</li>}
        {!(
          row.problem_bad_odour === 1 ||
          row.problem_mosquitos === 1 ||
          row.problem_stray_animals === 1 ||
          row.problem_congestion === 1 ||
          row.problem_other === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Solution Suggested by Interviewee */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Solution Suggested by Interviewee:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.solution_bins_facilities === 1 && <li style={{ margin: 0, padding: 0 }}>Bins and Facilities</li>}
        {row.solution_technology_monitoring === 1 && <li style={{ margin: 0, padding: 0 }}>Technology-Enabled Monitoring</li>}
        {row.solution_strict_enforcement === 1 && <li style={{ margin: 0, padding: 0 }}>Strict Enforcement Measures </li>}
        {row.solution_public_awareness === 1 && <li style={{ margin: 0, padding: 0 }}>Public Awareness & Education </li>}
        {row.solution_sanitization_roster === 1 && <li style={{ margin: 0, padding: 0 }}>Sanitization Vehicle Roster</li>}
        {row.solution_regulatory_support === 1 && <li style={{ margin: 0, padding: 0 }}>Regulatory & Administrative Support</li>}
        {row.solution_efficient_collection === 1 && <li style={{ margin: 0, padding: 0 }}>Efficient Waste Collection System</li>}
        {row.solution_neutral === 1 && <li style={{ margin: 0, padding: 0 }}>Neutral Feedback</li>}
        {!(
          row.solution_bins_facilities === 1 ||
          row.solution_technology_monitoring === 1 ||
          row.solution_strict_enforcement === 1 ||
          row.solution_public_awareness === 1 ||
          row.solution_sanitization_roster === 1 ||
          row.solution_regulatory_support === 1 ||
          row.solution_efficient_collection === 1 ||
          row.solution_neutral === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>
    </div>
  );
};

// DataTable Component
const DataTable = ({ data, onRowClick, selectedRowIndex }) => {
  const tableData = [...data].sort((a, b) => {
    const wardA = a["GVP Ward"] ? Number(a["GVP Ward"]) : Infinity;
    const wardB = b["GVP Ward"] ? Number(b["GVP Ward"]) : Infinity;
    return wardA - wardB;
  });

  const rowColors = [
    "#FFEBEE",
    "#FFF3E0",
    "#FFF9C4",
    "#E8F5E9",
    "#E3F2FD",
    "#F3E5F5",
    "#ECEFF1",
    "#FFFDE7",
  ];

  if (tableData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg text-center mt-6">
        <p className="text-gray-500 italic">
          No Garbage Points found for the current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Photos and Videos of Garbage Points
      </h2>
      <div className="overflow-y-auto max-h-[348px]">
        <table className="min-w-full divide-y divide-gray-200 table-fixed text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                GVP Ward
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 fonts-medium uppercase">
                Nearest Location
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Media
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.slice(0, 50).map((row, index) => {
              const isSelected = selectedRowIndex === index;
              return (
                <tr
                  key={index}
                  className="hover:bg-yellow-50/50 transition duration-150 cursor-pointer"
                  style={{
                    height: "40px",
                    backgroundColor: isSelected
                      ? "#FFD54F"
                      : rowColors[index % rowColors.length],
                  }}
                  onClick={() => onRowClick(index)}
                >
                  <td className="px-4 text-sm font-medium text-gray-900">
                    {row["GVP Ward"] || "N/A"}
                  </td>
                  <td className="px-4 text-sm text-gray-700">
                    {row["Nearest Location"] || "N/A"}
                  </td>
                  <td className="media-cell px-4 text-sm text-gray-700">
                    {typeof row["Photo URL"] === "string" && row["Photo URL"].startsWith("http") ? (
                      <a
                        href={row["Photo URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-btn photo"
                      >
                        📷 Photo
                      </a>
                    ) : null}
                    {typeof row["Video URL"] === "string" && row["Video URL"].startsWith("http") ? (
                      <a
                        href={row["Video URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-btn video"
                      >
                        🎥 Video
                      </a>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Colors for pie chart
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
  "#DC143C",
  "#2E8B57",
  "#808080",
];

// Ward-specific color names for map markers
const WARD_COLOR_MAP = {
  "12": "red",
  "13": "green",
  "14": "blue",
  "15": "orange",
};

// Colors for bar charts
const BAR_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
];

// Card size classes
const CARD_SIZE_CLASSES = "w-[250px] h-32";

// Custom label for BarCharts
const renderCustomBarLabel = ({ x, y, width, value, height }) => {
  const screenWidth = window.innerWidth;
  const fontSize = screenWidth < 640 ? 10 : 14;
  const offset = screenWidth < 640 ? 8 : 20;

  return (
    <text
      x={x + width + offset}
      y={y + height / 2}
      fill="#333"
      textAnchor="start"
      dominantBaseline="middle"
      style={{ fontSize, fontWeight: "bold" }}
    >
      {`${value.toFixed(1)}%`}
    </text>
  );
};

// Calculate Problems Data with Normalization
const calculateProblemsData = (data) => {
  const problemMap = {
    "Bad Odour": "problem_bad_odour",
    "Mosquitos": "problem_mosquitos",
    "Stray Animals": "problem_stray_animals",
    "Congestion": "problem_congestion",
    "Other": "problem_other",
  };

  const problemsCount = {};
  Object.keys(problemMap).forEach((display) => (problemsCount[display] = 0));

  data.forEach((row) => {
    Object.entries(problemMap).forEach(([display, key]) => {
      if (row[key] === 1) problemsCount[display] += 1;
    });
  });

  const totalCount = Object.values(problemsCount).reduce((sum, count) => sum + count, 0);
  return Object.entries(problemsCount)
    .map(([problem, count]) => ({
      name: problem,
      value: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

// Calculate Reasons Data with Normalization
const calculateReasonsData = (data) => {
  const reasonsCount = {
    "No Regular Collection Vehicle": 0,
    "Random People Throwing Garbage": 0,
    "Due To User Fee": 0,
    "Mismatch of Vehicle Time": 0,
    "Due to Narrow Road": 0,
    "Because of Market and Street Vendors": 0,
  };

  data.forEach((row) => {
    reasonsCount["No Regular Collection Vehicle"] += row.reason_no_collection || 0;
    reasonsCount["Random People Throwing Garbage"] += row.reason_random_people || 0;
    reasonsCount["Due To User Fee"] += row.reason_user_fee || 0;
    reasonsCount["Mismatch of Vehicle Time"] += row.reason_vehicle_time || 0;
    reasonsCount["Due to Narrow Road"] += row.reason_narrow_road || 0;
    reasonsCount["Because of Market and Street Vendors"] += row.reason_market_vendors || 0;
  });

  const totalCount = Object.values(reasonsCount).reduce((sum, count) => sum + count, 0);

  return Object.entries(reasonsCount)
    .map(([reason, count]) => ({
      name: reason,
      value: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

// Category Map for Who Dispose
const categoryMap = [
  {
    category: "Households",
    keywords: [
      "जवळ पास असलेले सोसायटी",
      "Banglow wale log aju baju ke",
      "House hol",
      "other",
      "Household",
      "near by peoples",
      "House holds",
      "Nearby Households",
      "जवळ पास लोकांनी टाकतात आणि बाहेरून येणारे पण",
      "Household",
      "Householdss",
      "Nearby household",
      "colony people",
      "Near by houshold",
      "Nearby Households",
      "Citizens",
      "Residental peoples",
    ],
  },
  {
    category: "Vendors",
    keywords: [
      "small stalls",
      "Market wale log kachra dalte hai",
      "Vendor",
      "Street Vendorss ",
      "Vendors and Households",
      "Vendorss",
      "Street Vendors",
      "Chai wale",
      "People and households & street vendors",
      "vendors like fish and vegetables sellers",
      " Small Stalls",
      " shop keeper",
      "Street Vendors",
      " Street vendor",
      "Vendorss",
      " street vendors",
      "Small stall",
      "Shops",
    ],
  },
  {
    category: "People from Outside",
    keywords: [
      "people from outside",
      "People From Outside",
      "outside people",
      "Outside people",
      "people from Outside",
      "People from Outside",
      "People from outside",
    ],
  },
  {
    category: "Passing Crowd",
    keywords: [
      "आजुबाजूला असलेले लोक आणि ऑटो मधून जाणारे लोक पण येते कचरा टाकतात",
      "कचरा गाडीवरून जाणारे व्यक्ती पण टाकतात आणि सोबत जवळपास राहणारे व्यक्ती पण टाकतात",
      "जवळ पास चे लोक आणि रस्त्यावरून जाणारे लोक",
      "पर्यटक आणि बाजूचे स्टॉल वाले कचरे टाकतात",
      "Tourist",
      "जवळ पास चे लोक और रस्त्यावरून जाणाऱ्या लोक",
      "गाडीवरून येणाऱ्या लोक कचरा फेकून जातात",
      "जाण्या येणाऱ्या गाड्या वरून लोक फेकतात",
      "बाहेरून येणाऱ्या लोक कचरा टाकुण जाते",
    ],
  },
  {
    category: "Others",
    keywords: [
      "माहित नाही",
      "लहुजी सावळे उद्यान अंबाझरी लेक",
      "Showroom",
      "N",
      "Unknownearby HouseHolds",
    ],
  },
];

function categorize(text) {
  if (!text || typeof text !== "string" || text.trim() === "" || text === "N/A") {
    return null;
  }
  const lowerText = text.toLowerCase().trim();
  for (const { category, keywords } of categoryMap) {
    if (keywords.some((k) => lowerText.includes(k.toLowerCase().trim()))) {
      return category;
    }
  }
  return "Others";
}

// Calculate Who Dispose Data with Categorization
const calculateWhoDisposeData = (data) => {
  const disposeCount = {
    Households: 0,
    Vendors: 0,
    "People from Outside": 0,
    "Passing Crowd": 0,
    Others: 0,
  };

  data.forEach((row) => {
    disposeCount["Households"] += row.dispose_households || 0;
    disposeCount["Vendors"] += row.dispose_vendors || 0;
    disposeCount["People from Outside"] += row.dispose_people_outside || 0;
    disposeCount["Passing Crowd"] += row.dispose_passing_crowd || 0;
    disposeCount["Others"] += row.dispose_others || 0;
  });

  const totalCount = Object.values(disposeCount).reduce((sum, count) => sum + count, 0);

  if (totalCount === 0) {
    return Object.keys(disposeCount).map((name) => ({ name, value: 0 }));
  }

  return Object.entries(disposeCount)
    .map(([name, count]) => ({
      name,
      value: (count / totalCount) * 100,
    }))
    .sort((a, b) => b.value - a.value);
};

// Calculate Location Data with Categorization
const locationMap = [
  {
    category: "Residential Area",
    keywords: ["residential", "colony", "house", "society"],
  },
  {
    category: "Nallah / Drain",
    keywords: ["nallah", "drain"],
  },
  {
    category: "Market / Commercial Area",
    keywords: ["market_place", "market", "bazaar", "shop"],
  },
  {
    category: "Playground / Open Space",
    keywords: ["playground", "ground", "sports", "field"],
  },
  {
    category: "School / Institution",
    keywords: ["school", "college", "institution"],
  },
  {
    category: "Open Plot / Vacant Land",
    keywords: ["open_plot", "vacant", "empty plot"],
  },
  {
    category: "Roadside / Footpath / Public Path",
    keywords: [
      "road",
      "roadside",
      "road side",
      "public path",
      "corner",
      "square",
      "front side",
      "temple",
      "collector office",
      "near sadar",
      "sem",
    ],
  },
  {
    category: "Water Body / Lake Area",
    keywords: ["lake", "water", "pond", "नदी", "लेक"],
  },
  {
    category: "Other / Miscellaneous",
    keywords: ["other", "unknown", "misc"],
  },
];

function categorizeLocation(text) {
  const lowerText = (text || "").toLowerCase().trim();
  for (const { category, keywords } of locationMap) {
    if (keywords.some((k) => lowerText.includes(k))) {
      return category;
    }
  }
  return "Other / Miscellaneous";
}

const calculateSettingData = (data) => {
  const settingCount = {
    "Residential Area": 0,
    "Nallah / Drain": 0,
    "Market / Commercial Area": 0,
    "Playground / Open Space": 0,
    "School / Institution": 0,
    "Open Plot / Vacant Land": 0,
    "Roadside / Footpath / Public Path": 0,
    "Water Body / Lake Area": 0,
    "Other / Miscellaneous": 0,
  };

  data.forEach((row) => {
    settingCount["Residential Area"] += row.setting_residential || 0;
    settingCount["Nallah / Drain"] += row.setting_nallah || 0;
    settingCount["Market / Commercial Area"] += row.setting_market || 0;
    settingCount["Playground / Open Space"] += row.setting_playground || 0;
    settingCount["School / Institution"] += row.setting_school || 0;
    settingCount["Open Plot / Vacant Land"] += row.setting_open_plot || 0;
    settingCount["Roadside / Footpath / Public Path"] += row.setting_roadside || 0;
    settingCount["Water Body / Lake Area"] += row.setting_water_body || 0;
    settingCount["Other / Miscellaneous"] += row.setting_other || 0;
  });

  const totalCount = Object.values(settingCount).reduce((sum, count) => sum + count, 0);

  return Object.entries(settingCount)
    .map(([name, count]) => ({
      name,
      value: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

// Solution Categories
const solutionCategories = [
  {
    category: "Bins and Facilities",
    keywords: [
      "Dust bin at Roadside",
      "Should Punishment Fee",
      "More Bins",
      "Bins",
      "More bins",
      "More Bins Awareness Among People",
      "Dustbins",
      "Add a board ",
      "Say to Use Of Dustbin",
      "Add Dustbin",
      " Bins Too",
      " Dustbins and Strictly Fine",
      "Bins and Facilities and strict fines",
      "Increasing of Dustbin",
    ],
  },
  {
    category: "Technology-Enabled Monitoring",
    keywords: [
      "Fine and Surveillance Camera at that Place",
      "Surveillance Camera at that Place",
      "install camera on street.",
      "Should Camera Surveillance",
    ],
  },
  {
    category: "Strict Enforcement Measures ",
    keywords: [
      "Strict Fines",
      "strictly fine for people",
      "Strictly Fine",
      "strict fines",
      "and strictly fine for people",
    ],
  },
  {
    category: "Public Awareness & Education ",
    keywords: [
      "Awareness Program",
      "Awareness Among People",
      "More Bins Awareness Among People",
    ],
  },
  {
    category: "Sanitization Vehicle Roster",
    keywords: ["Should Regular Visit of Cleaner Vans"],
  },
  {
    category: "Regulatory & Administrative Support",
    keywords: ["the NMC vehicle should collect this garbage from here ."],
  },
  {
    category: "Efficient Waste Collection System",
    keywords: [
      "Proper schedule for collection vehicle",
      "The Place Need to be get cleaned from the road side on daily basis.",
    ],
  },
  {
    category: "Neutral Feedback",
    keywords: ["Nothing"],
  },
];

function categorizeSolution(text) {
  const lowerText = (text || "").toLowerCase().trim();
  for (const { category, keywords } of solutionCategories) {
    if (keywords.some((k) => lowerText.includes(k.toLowerCase()))) {
      return category;
    }
  }
  return null;
}

// Calculate Solution Data with Categorization
const calculateSolutionData = (data) => {
  const solutionCount = {
    "Bins and Facilities": 0,
    "Technology-Enabled Monitoring": 0,
    "Strict Enforcement Measures ": 0,
    "Public Awareness & Education ": 0,
    "Sanitization Vehicle Roster": 0,
    "Regulatory & Administrative Support": 0,
    "Efficient Waste Collection System": 0,
    "Neutral Feedback": 0,
  };

  data.forEach((row) => {
    solutionCount["Bins and Facilities"] += row.solution_bins_facilities || 0;
    solutionCount["Technology-Enabled Monitoring"] += row.solution_technology_monitoring || 0;
    solutionCount["Strict Enforcement Measures "] += row.solution_strict_enforcement || 0;
    solutionCount["Public Awareness & Education "] += row.solution_public_awareness || 0;
    solutionCount["Sanitization Vehicle Roster"] += row.solution_sanitization_roster || 0;
    solutionCount["Regulatory & Administrative Support"] += row.solution_regulatory_support || 0;
    solutionCount["Efficient Waste Collection System"] += row.solution_efficient_collection || 0;
    solutionCount["Neutral Feedback"] += row.solution_neutral || 0;
  });

  const totalCount = Object.values(solutionCount).reduce((sum, count) => sum + count, 0);

  if (totalCount === 0) {
    return Object.keys(solutionCount).map((name) => ({ name, value: 0 }));
  }

  return Object.entries(solutionCount)
    .map(([name, count]) => ({
      name,
      value: (count / totalCount) * 100,
    }))
    .sort((a, b) => b.value - a.value);
};

const wasteReasonsMap = {
  "No Regular Collection Vehicle": ["no_regular_collection_vehicle"],
  "Random People Throwing Garbage": ["anti_social_behaviour__youngsters_throwi"],
  "Due To User Fee": ["due_to_user_fee"],
  "Mismatch of Vehicle Time": ["mis_match_of_vehicle_time__many_people_l"],
  "Due to Narrow Road": ["due_to_narrow_road__difficult_for_vehicl"],
  "Because of Market and Street Vendors": ["because_of_market___street_vendors"]
};

// Unified normalization function - ENHANCED FOR ALL ISSUES
const normalizeRow = (row) => {
  const norm = { ...row };

  // Ward
  const wardValue = row["GVP Ward"] || row["Select_the_ward"] || row["GVP_Ward"] || row.ward || row.ward_no || row.ward_number || null;
  if (wardValue !== null) {
    norm["GVP Ward"] = Number(wardValue);
    norm.cluster_id = norm["GVP Ward"];
  }

  // ID
  const idValue = row.id || row.gvp_id || row._id || row.GVP_ID || null;
  if (idValue !== null) norm.id = idValue;

  // Location
  let lat = row["_Record_the_location_of_GVP_latitude"] || row.latitude || row.lat || null;
  let lng = row["_Record_the_location_of_GVP_longitude"] || row.longitude || row.lng || null;
  const locStr = row["Record_the_location_of_GVP"] || row.location || null;
  if ((!lat || !lng) && locStr) {
    const parts = String(locStr).trim().split(/\s+/);
    if (parts.length >= 2) {
      lat = parseFloat(parts[0]) || lat;
      lng = parseFloat(parts[1]) || lng;
    }
  }
  if (lat !== null) norm["_Record_the_location_of_GVP_latitude"] = Number(lat);
  if (lng !== null) norm["_Record_the_location_of_GVP_longitude"] = Number(lng);

  // Waste type normalization (0/1)
  const wasteMap = {
    "Organic_and_Wet_Waste": "Organic and Wet Waste",
    "Organic and Wet Waste": "Organic and Wet Waste",
    "Plastic_Paper_Glass_Waste": "Plastic Paper Glass Waste",
    "Plastic Paper Glass Waste": "Plastic Paper Glass Waste",
    "Sanitary_and_Hazardous_Waste": "Sanitary and Hazardous Waste",
    "Sanitary and Hazardous Waste": "Sanitary and Hazardous Waste",
    "Battery_and_Bulb_Waste": "Battery and Bulb Waste",
    "Battery and Bulb Waste": "Battery and Bulb Waste",
    "Construction_and_Demolition_Waste": "Construction and Demolition Waste",
    "Construction and Demolition Waste": "Construction and Demolition Waste",
    "Clothes Waste": "Clothes Waste",
    "Carcasses Waste": "Carcasses Waste",
    "Others": "Others",
  };
  Object.entries(wasteMap).forEach(([srcKey, targetKey]) => {
    if (row[srcKey] !== undefined) {
      let val = row[srcKey];
      if (val === "1_0" || val === "1" || val === 1 || val === true || String(val).trim() === "1") {
        val = 1;
      } else if (val === "0_0" || val === "0" || val === 0 || val === false || String(val).trim() === "0") {
        val = 0;
      } else {
        val = 0;
      }
      norm[targetKey] = val;
    }
  });

  const allWasteColumns = [
    "Organic and Wet Waste",
    "Plastic Paper Glass Waste",
    "Sanitary and Hazardous Waste",
    "Battery and Bulb Waste",
    "Construction and Demolition Waste",
    "Clothes Waste",
    "Carcasses Waste",
    "Others",
  ];
  allWasteColumns.forEach((col) => {
    if (norm[col] === undefined) {
      norm[col] = 0;
    } else if (typeof norm[col] !== "number") {
      norm[col] = (norm[col] === 1 || norm[col] === true || String(norm[col]).trim() === "1") ? 1 : 0;
    }
  });

  // API waste type normalization
  const apiWaste = row["What_kind_of_waste_do_you_obse"] || '';
  const selectedWaste = apiWaste.split(' ').filter(Boolean);
  const apiMapping = {
    'wet_waste_organic_waste': "Organic and Wet Waste",
    'dry_waste__plastic_paper_glass': "Plastic Paper Glass Waste",
    'domestic_hazardous_sanitary_na': "Sanitary and Hazardous Waste",
    'e_waste_batteries__bulbs_etc': "Battery and Bulb Waste",
    'construction_and_demolition_wa': "Construction and Demolition Waste",
    'clothes': "Clothes Waste",
    'carcasses': "Carcasses Waste",
    'others': "Others",
  };
  for (const sel of selectedWaste) {
    const column = apiMapping[sel];
    if (column) {
      norm[column] = 1;
    }
  }

  // Prioritize existing fields if present (static JSON)
  let photoUrl = row["Photo URL"] || "";
  let videoUrl = row["Video URL"] || "";

  // Treat "N/A" as missing/invalid
  if (photoUrl === "N/A") photoUrl = "";
  if (videoUrl === "N/A") videoUrl = "";

  // If not set or empty, check _attachments (API data)
  if (!photoUrl || !videoUrl) {
    if (Array.isArray(row._attachments)) {
      const photoAttachment = row._attachments.find(att => att.mimetype === "image/jpeg");
      const videoAttachment = row._attachments.find(att => att.mimetype === "video/mp4");
      if (!photoUrl && photoAttachment) photoUrl = photoAttachment.download_url || "";
      if (!videoUrl && videoAttachment) videoUrl = videoAttachment.download_url || "";
    }
  }

  // Always set in normalized object
  norm["Photo URL"] = photoUrl;
  norm["Video URL"] = videoUrl;

  // === FIX 1: Waste quantity normalization ===
  let rawQuantity = row["Approx_Waste_Quantity_Found_at_GVP"];

  if (!rawQuantity || String(rawQuantity).trim() === "") {
    rawQuantity = row["Approx Waste Quantity Found at GVP"] ||
                  row["Waste Quantity"] ||
                  row["approx_waste_quantity_found_at_gvp"] ||
                  row["ApproxWasteQuantityFoundatGVP"] ||
                  row["Approx_quantity_of_waste_at_GV"] ||
                  "";
  }

  const cleanedQuantity = String(rawQuantity || "").trim().toLowerCase().replace(/\s+/g, '_');
  const normalizedWeight = getWasteWeight(cleanedQuantity);

  norm["waste_hath_gadi"] = normalizedWeight;           // Primary normalized numeric field
  norm["Waste Quantity Numeric"] = normalizedWeight;    // For tooltip compatibility

  // === FIX 2: Nearest Location normalization ===
  let nearestLocation = row["Nearest_Location"] || row["Nearest Location"] || row["Nearest_Landmark_nearby_GVP"] || "";
  nearestLocation = String(nearestLocation).trim().replace(/[\r\n]+/g, " ");
  norm["Nearest Location"] = nearestLocation || null;  // Set to null if empty, table handles "N/A"

  norm.city = row.city || row.City || "Nagpur";

  // === FIX for Who Dispose columns ===
  norm["Who Dispose1"] = row["Who Dispose1"] || row["Who_Dispose1"] || "N/A";
  norm["Who Dispose2"] = row["Who Dispose2"] || row["Who_Dispose2"] || "N/A";
  norm["Who Dispose3"] = row["Who Dispose3"] || row["Who_Dispose3"] || "N/A";

  // Problem normalization
  const problemStaticMap = {
    "Bad Odour": "problem_bad_odour",
    "Mosquitos": "problem_mosquitos",
    "Stray Animals": "problem_stray_animals",
    "Congestion": "problem_congestion",
    "Other": "problem_other",
  };
  Object.entries(problemStaticMap).forEach(([staticKey, normKey]) => {
    norm[normKey] = row[staticKey] === 1 ? 1 : 0;
  });

  const apiProblems = row["What_kind_of_problems_do_you_e"] || '';
  const selectedProblems = apiProblems.split(' ').filter(Boolean);
  const apiProblemMapping = {
    'bad_odour': "problem_bad_odour",
    'mosquitoes': "problem_mosquitos",
    'stray_animals': "problem_stray_animals",
    'congestion': "problem_congestion",
    'other': "problem_other",
  };
  for (const sel of selectedProblems) {
    const normKey = apiProblemMapping[sel];
    if (normKey) {
      norm[normKey] = 1;
    }
  }

  // Who Dispose normalization
  norm.dispose_households = 0;
  norm.dispose_vendors = 0;
  norm.dispose_people_outside = 0;
  norm.dispose_passing_crowd = 0;
  norm.dispose_others = 0;

  // Static logic
  const staticColumns = ["Who Dispose1", "Who Dispose2", "Who Dispose3"];
  const staticCategories = new Set();
  staticColumns.forEach((col) => {
    const value = norm[col];
    if (value && value !== "N/A") {
      const cat = categorize(value);
      if (cat) {
        staticCategories.add(cat);
      }
    }
  });
  staticCategories.forEach((cat) => {
    if (cat === "Households") norm.dispose_households = 1;
    if (cat === "Vendors") norm.dispose_vendors = 1;
    if (cat === "People from Outside") norm.dispose_people_outside = 1;
    if (cat === "Passing Crowd") norm.dispose_passing_crowd = 1;
    if (cat === "Others") norm.dispose_others = 1;
  });

  // API logic
  const apiDispose = row["Who_disposes_the_waste_at_the_"] || '';
  const selectedDispose = apiDispose.split(' ').filter(Boolean);
  const apiDisposeMapping = {
    'households': "Households",
    'vendors': "Vendors",
    'people_from_outside': "People from Outside",
    'passing_crowd': "Passing Crowd",
    'others': "Others",
    'n_a': "Others",
  };
  const apiCategories = new Set();
  selectedDispose.forEach((sel) => {
    const cat = apiDisposeMapping[sel];
    if (cat) {
      apiCategories.add(cat);
    }
  });
  apiCategories.forEach((cat) => {
    if (cat === "Households") norm.dispose_households = 1;
    if (cat === "Vendors") norm.dispose_vendors = 1;
    if (cat === "People from Outside") norm.dispose_people_outside = 1;
    if (cat === "Passing Crowd") norm.dispose_passing_crowd = 1;
    if (cat === "Others") norm.dispose_others = 1;
  });

  // Solutions normalization
  norm.solution_bins_facilities = 0;
  norm.solution_technology_monitoring = 0;
  norm.solution_strict_enforcement = 0;
  norm.solution_public_awareness = 0;
  norm.solution_sanitization_roster = 0;
  norm.solution_regulatory_support = 0;
  norm.solution_efficient_collection = 0;
  norm.solution_neutral = 0;

  const solutionCats = new Set();

  // Static solutions
  const staticSolutionColumns = [
    "Solution Suggested by Interviewee1",
    "Solution Suggested by Interviewee2",
    "Solution Suggested by Interviewee3",
  ];
  staticSolutionColumns.forEach((col) => {
    const value = row[col];
    if (value && value.trim() !== "" && value !== "N/A") {
      const cat = categorizeSolution(value);
      if (cat) {
        solutionCats.add(cat);
      }
    }
  });

  // API solutions
  const apiSolution = row["What_solutions_do_you_think_wo"] || '';
  const selectedApi = apiSolution.split(' ').filter(Boolean);
  const apiSolutionMap = {
    'strict_enforcement_measures': "Strict Enforcement Measures ",
    'bins_and_facilities': "Bins and Facilities",
    'public_awareness__education': "Public Awareness & Education ",
    'sanitization_vehicle_roster': "Sanitization Vehicle Roster",
    'technology_enabledmonitoring': "Technology-Enabled Monitoring",
    'efficient_waste_collectionsystem': "Efficient Waste Collection System",
    'regulatory___administrativesupport': "Regulatory & Administrative Support",
    'neutral_feedback': "Neutral Feedback",
    'n_a': "Neutral Feedback",
  };
  selectedApi.forEach((sel) => {
    const cat = apiSolutionMap[sel];
    if (cat) {
      solutionCats.add(cat);
    }
  });

  // Set normalized fields
  solutionCats.forEach((cat) => {
    if (cat === "Bins and Facilities") norm.solution_bins_facilities = 1;
    if (cat === "Technology-Enabled Monitoring") norm.solution_technology_monitoring = 1;
    if (cat === "Strict Enforcement Measures ") norm.solution_strict_enforcement = 1;
    if (cat === "Public Awareness & Education ") norm.solution_public_awareness = 1;
    if (cat === "Sanitization Vehicle Roster") norm.solution_sanitization_roster = 1;
    if (cat === "Regulatory & Administrative Support") norm.solution_regulatory_support = 1;
    if (cat === "Efficient Waste Collection System") norm.solution_efficient_collection = 1;
    if (cat === "Neutral Feedback") norm.solution_neutral = 1;
  });

  // Setting normalization
  norm.setting_residential = 0;
  norm.setting_nallah = 0;
  norm.setting_market = 0;
  norm.setting_playground = 0;
  norm.setting_school = 0;
  norm.setting_open_plot = 0;
  norm.setting_roadside = 0;
  norm.setting_water_body = 0;
  norm.setting_other = 0;

  const settingValue = row["In_what_setting_is_the_GVP_pre"] || row["Location Type"] || row["other"] || row["Kindly_specify_the_area"] || "";
  const settingCategory = categorizeLocation(settingValue);

  if (settingCategory === "Residential Area") norm.setting_residential = 1;
  else if (settingCategory === "Nallah / Drain") norm.setting_nallah = 1;
  else if (settingCategory === "Market / Commercial Area") norm.setting_market = 1;
  else if (settingCategory === "Playground / Open Space") norm.setting_playground = 1;
  else if (settingCategory === "School / Institution") norm.setting_school = 1;
  else if (settingCategory === "Open Plot / Vacant Land") norm.setting_open_plot = 1;
  else if (settingCategory === "Roadside / Footpath / Public Path") norm.setting_roadside = 1;
  else if (settingCategory === "Water Body / Lake Area") norm.setting_water_body = 1;
  else if (settingCategory === "Other / Miscellaneous") norm.setting_other = 1;

  // Reasons normalization
  norm.reason_no_collection = 0;
  norm.reason_random_people = 0;
  norm.reason_user_fee = 0;
  norm.reason_vehicle_time = 0;
  norm.reason_narrow_road = 0;
  norm.reason_market_vendors = 0;

  // Static reasons
  if (row["No Regular Collection Vehicle"] === 1 || row["No Regular Collection Vehicle"] === true) norm.reason_no_collection = 1;
  if (row["Random People Throwing Garbage"] === 1 || row["Random People Throwing Garbage"] === true) norm.reason_random_people = 1;
  if (row["Due To User Fee"] === 1 || row["Due To User Fee"] === true) norm.reason_user_fee = 1;
  if (row["Mismatch of Vehicle Time"] === 1 || row["Mismatch of Vehicle Time"] === true) norm.reason_vehicle_time = 1;
  if (row["Due to Narrow Road"] === 1 || row["Due to Narrow Road"] === true) norm.reason_narrow_road = 1;
  if (row["Because of Market and Street Vendors"] === 1 || row["Because of Market and Street Vendors"] === true) norm.reason_market_vendors = 1;

  // API reasons
  const apiReasons = row["What_might_be_the_reason_for_w"] || '';
  const selectedReasons = apiReasons.split(' ').filter(Boolean);
  const apiReasonsMapping = {};
  Object.entries(wasteReasonsMap).forEach(([display, apis]) => {
    apis.forEach(api => apiReasonsMapping[api] = display);
  });
  selectedReasons.forEach((sel) => {
    const reason = apiReasonsMapping[sel];
    if (reason === "No Regular Collection Vehicle") norm.reason_no_collection = 1;
    if (reason === "Random People Throwing Garbage") norm.reason_random_people = 1;
    if (reason === "Due To User Fee") norm.reason_user_fee = 1;
    if (reason === "Mismatch of Vehicle Time") norm.reason_vehicle_time = 1;
    if (reason === "Due to Narrow Road") norm.reason_narrow_road = 1;
    if (reason === "Because of Market and Street Vendors") norm.reason_market_vendors = 1;
  });

  return norm;
};

// Stable deduplication
const deduplicate = (rows) => {
  const seen = new Map();
  const unique = [];
  for (const row of rows) {
    let key = null;
    if (row.id !== undefined && row.id !== null) key = `id:${row.id}`;
    else if (row.cluster_id !== undefined && row.cluster_id !== null) key = `cluster:${row.cluster_id}`;
    else {
      const lat = Number(row["_Record_the_location_of_GVP_latitude"] || 0).toFixed(6);
      const lng = Number(row["_Record_the_location_of_GVP_longitude"] || 0).toFixed(6);
      key = `loc:${lat}_${lng}`;
    }
    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(row);
    }
  }
  return unique;
};

// City Slicer Component
const CitySlicer = ({ selectedCity, setSelectedCity }) => {
  const cities = ["Nagpur", "Pune", "Bangalore", "Andman and Nicobar Island"];
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
        Select City
      </h2>
      <select
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-white text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
};

function App() {
  const [apiData, setApiData] = useState([]);
  const [normalizedMergedData, setNormalizedMergedData] = useState([]);
  const [selectedWards, setSelectedWards] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Nagpur");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });

  const staticNormalized = useMemo(() => staticDataRaw.map(normalizeRow), []);

  useEffect(() => {
    const combined = [...staticNormalized, ...apiData];
    const unique = deduplicate(combined);
    setNormalizedMergedData(unique);
  }, [staticNormalized, apiData]);

  useEffect(() => {
    fetch("https://kobo-proxy.onrender.com/api/kobo")
      .then((res) => {
        setIsLoading(false);
        if (!res.ok) {
          setError(`API failure, status: ${res.status}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data !== null) {
          const rawResults = Array.isArray(data.results) ? data.results : [];
          const normalizedApi = rawResults.map(normalizeRow);
          setApiData(normalizedApi);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setError(`API Error: ${err.message}`);
      });
  }, []);

  const uniqueWards = useMemo(() => {
    const wardsSet = new Set(
      normalizedMergedData
        .map((row) =>
          row["GVP Ward"] !== null && row["GVP Ward"] !== undefined
            ? String(row["GVP Ward"])
            : null
        )
        .filter(Boolean)
    );
    return Array.from(wardsSet).sort((a, b) => Number(a) - Number(b));
  }, [normalizedMergedData]);

  const filteredData = useMemo(() => {
    return normalizedMergedData.filter((row) => {
      const rowCity = (row.city || "Nagpur").toLowerCase().trim();
      const selected = selectedCity.toLowerCase().trim();
      const wardMatch = selectedWards.length === 0 || selectedWards.includes(String(row["GVP Ward"]));
      return rowCity === selected && wardMatch;
    });
  }, [normalizedMergedData, selectedWards, selectedCity]);

  const filteredTableData = useMemo(() => {
    return filteredData;
  }, [filteredData]);

  const selectedRow = selectedRowIndex !== null ? filteredTableData[selectedRowIndex] : null;

  const filteredDataForCards = useMemo(() => {
    return selectedRow ? [selectedRow] : filteredData;
  }, [selectedRow, filteredData]);

  const totalGarbagePoints = filteredData.length;

  const totalHathGadiVolume = useMemo(() => {
    return filteredDataForCards.reduce((sum, row) => {
      const weight = Number(row["waste_hath_gadi"]) || 0;
      return sum + weight;
    }, 0);
  }, [filteredDataForCards]);

  const pieData = useMemo(() => {
    return selectedRow
      ? calculatePieForRow(selectedRow)
      : calculateWasteTypeCounts(filteredDataForCards);
  }, [selectedRow, filteredDataForCards]);

  const problemsData = useMemo(() => calculateProblemsData(filteredDataForCards), [filteredDataForCards]);
  const reasonsData = useMemo(() => calculateReasonsData(filteredDataForCards), [filteredDataForCards]);
  const whoDisposeData = useMemo(() => calculateWhoDisposeData(filteredDataForCards), [filteredDataForCards]);
  const settingData = useMemo(() => calculateSettingData(filteredDataForCards), [filteredDataForCards]);
  const solutionData = useMemo(() => calculateSolutionData(filteredDataForCards), [filteredDataForCards]);

  const mapCenter = [21.135, 79.085];

  const handleMarkerClick = (row) => {
    const keyOfRow = `${row["_Record_the_location_of_GVP_latitude"]}-${row["_Record_the_location_of_GVP_longitude"]}-${row["GVP Ward"]}`;
    const idx = filteredTableData.findIndex(
      (r) => `${r["_Record_the_location_of_GVP_latitude"]}-${r["_Record_the_location_of_GVP_longitude"]}-${r["GVP Ward"]}` === keyOfRow
    );

    if (idx !== -1) {
      if (selectedRowIndex === idx) {
        setSelectedRowIndex(null);
      } else {
        setSelectedRowIndex(idx);
      }
      if (mapInstance) {
        const lat = Number(row["_Record_the_location_of_GVP_latitude"]);
        const lng = Number(row["_Record_the_location_of_GVP_longitude"]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          try {
            mapInstance.flyTo([lat, lng], 15, { animate: true, duration: 0.5 });
          } catch (e) {}
        }
      }
    }
  };

  const handleRowClick = (rowIndex) => {
    if (selectedRowIndex === rowIndex) {
      setSelectedRowIndex(null);
    } else {
      setSelectedRowIndex(rowIndex);
    }
  };

  const handleWardChange = (e) => {
    const ward = e.target.value;
    const isChecked = e.target.checked;
    setSelectedWards((prev) =>
      isChecked ? [...prev, ward] : prev.filter((w) => w !== ward)
    );
  };

  const handleSelectAll = () => {
    setSelectedWards(uniqueWards);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isNagpurSelected = selectedCity === "Nagpur";

  useEffect(() => {
    if (mapInstance && selectedRow) {
      const lat = Number(selectedRow["_Record_the_location_of_GVP_latitude"]);
      const lng = Number(selectedRow["_Record_the_location_of_GVP_longitude"]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        try {
          mapInstance.flyTo([lat, lng], Math.max(mapInstance.getZoom(), 15), {
            animate: true,
            duration: 0.6,
          });
        } catch (e) {}
      }
    }
  }, [selectedRow, mapInstance]);

  useEffect(() => {
    setSelectedRowIndex(null);
  }, [selectedWards, normalizedMergedData]);

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
      {/* Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Bharat Garbage Tracker
        </h1>
        
        {/* Menu Bar - Always Visible */}
        <nav className="flex justify-center space-x-8 mt-4 border-b border-gray-200 pb-2">
          <Link
            to="/"
            className="text-gray-600 hover:text-yellow-600 font-semibold transition duration-300"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-gray-600 hover:text-yellow-600 font-semibold transition duration-300"
          >
            About the Initiative
          </Link>
          <Link
            to="/partners"
            className="text-gray-600 hover:text-yellow-600 font-semibold transition duration-300"
          >
            Our Partners
          </Link>
          <Link to="/impact" className="text-gray-600 hover:text-yellow-600 font-semibold transition duration-300">Impact</Link>
          <a
            href="https://ee.kobotoolbox.org/x/JoXcMcRe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-yellow-600 font-semibold transition duration-300"
          >
            + Enter Data
          </a>
        </nav>
      </div>

      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/" element={
          <div className="flex flex-col lg:flex-row gap-6 mt-6">
            {/* LEFT COLUMN */}
            <div className="w-full lg:w-[460px] space-y-6">

              <CitySlicer selectedCity={selectedCity} setSelectedCity={setSelectedCity} />

              {isLoading ? (
                <div className="mt-6 p-10 bg-white rounded-xl shadow-2xl text-center">
                  <p className="text-2xl font-bold text-gray-800">Loading data...</p>
                </div>
              ) : error ? (
                <div className="mt-6 p-10 bg-white rounded-xl shadow-2xl text-center border-4 border-red-400">
                  <p className="text-2xl font-bold text-red-600">Error: {error}</p>
                </div>
              ) : isNagpurSelected ? (
                <>
                  {/* Summary Cards */}
                  <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-2 ">
                    <div className={`bg-white p-4 rounded-lg shadow-lg text-center border-b-4 border-yellow-500 flex flex-col justify-center ${CARD_SIZE_CLASSES}`}>
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        Total Garbage Points
                      </h2>
                      <p className="text-5xl font-extrabold mt-1 text-gray-900">
                        {totalGarbagePoints}
                      </p>
                    </div>

                    <div className={`bg-white p-4 rounded-lg shadow-lg text-center border-b-4 border-green-500 flex flex-col justify-center ${CARD_SIZE_CLASSES}`}>
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        GVP Waste Volume (Hath Gadi)
                      </h2>
                      <p className="text-5xl font-extrabold mt-1 text-gray-900">
                        {Math.round(totalHathGadiVolume)}
                      </p>
                    </div>
                  </div>

                  {/* Ward Selector */}
                  <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 relative ">
                    <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">Wards</h2>
                    <div className="relative">
                      <button
                        onClick={toggleDropdown}
                        className="w-full p-2 border rounded-lg shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-yellow-500 flex justify-between items-center"
                      >
                        {selectedWards.length > 0
                          ? `${selectedWards.length} ward(s) selected`
                          : "Select Wards"}
                        <span className="ml-2">▼</span>
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <label className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedWards.length === uniqueWards.length}
                              onChange={handleSelectAll}
                              className="form-checkbox h-4 w-4 text-yellow-500"
                            />
                            <span className="text-sm">All</span>
                          </label>
                          {uniqueWards.map((ward) => (
                            <label key={ward} className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer">
                              <input
                                type="checkbox"
                                value={ward}
                                checked={selectedWards.includes(ward)}
                                onChange={handleWardChange}
                                className="form-checkbox h-4 w-4 text-yellow-500"
                              />
                              <span className="text-sm">{ward}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                    <DataTable
                      data={selectedRow ? [selectedRow] : filteredDataForCards}
                      onRowClick={handleRowClick}
                      selectedRowIndex={selectedRowIndex}
                    />
                  </div>

                  {/* Pie Chart */}
                  <div className="bg-white rounded-lg shadow p-3 w-full">
                    <h3 className="text-center text-sm sm:text-base font-semibold mb-2">
                      Breakdown by Waste Type
                    </h3>

                    <div className="w-full h-72 sm:h-64 md:h-72 lg:h-80">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={isSmallScreen ? 60 : 90}
                            innerRadius={isSmallScreen ? 30 : 60}
                            paddingAngle={2}
                            label={renderCustomizedLabel(isSmallScreen)}
                            labelLine={true}
                            minAngle={5}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Solutions Chart */}
                  <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 ">
                    <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                      Top Solutions Suggested (by Citizens)
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={solutionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={isSmallScreen ? 120 : 180}
                          tick={{ fontSize: isSmallScreen ? 11 : 14 }}
                        />
                        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                        <Bar dataKey="value" barSize={isSmallScreen ? 14 : 22}
                          label={renderCustomBarLabel}>
                          {solutionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="mt-6 p-10 bg-white rounded-xl shadow-2xl text-center border-4 border-yellow-400">
                  <p className="text-4xl font-extrabold text-gray-800">
                    Coming Soon!
                  </p>
                  <p className="mt-4 text-xl text-gray-600">
                    Data and visualization for **{selectedCity}** will be available in a future update.
                  </p>
                  <button
                    onClick={() => setSelectedCity("Nagpur")}
                    className="mt-8 px-6 py-3 bg-yellow-500 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
                  >
                    Go back to Nagpur Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - Map + Key Findings */}
            <div className="flex-1 lg:space-y-6">

              {isNagpurSelected ? (
                <>
                  {/* Map */}
                  <div className="h-[700px] lg:h-[850px]">
                    <MapContainer
                      whenCreated={setMapInstance}
                      center={mapCenter}
                      zoom={13}
                      className="w-full h-full rounded-lg shadow-lg border border-gray-200"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {(selectedRow ? [selectedRow] : filteredDataForCards)
                        .filter((row) => row["_Record_the_location_of_GVP_latitude"] && row["_Record_the_location_of_GVP_longitude"])
                        .map((row, idx) => {
                          const lat = Number(row["_Record_the_location_of_GVP_latitude"]);
                          const lng = Number(row["_Record_the_location_of_GVP_longitude"]);
                          const ward = row["GVP Ward"] || "";
                          const stableKey = `${ward}-${lat}-${lng}-${idx}`;

                          const colorName = WARD_COLOR_MAP[ward] || "blue";

                          const customIcon = new L.Icon({
                            iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${colorName}.png`,
                            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${colorName}.png`,
                            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41],
                          });

                          return (
                            <Marker
                              key={stableKey}
                              position={[lat, lng]}
                              icon={customIcon}
                              eventHandlers={{
                                click: () => handleMarkerClick(row),
                              }}
                            >
                              <LeafletTooltip
                                direction="auto"
                                offset={[0, -20]}
                                opacity={1}
                                sticky={true}
                                permanent={false}
                                interactive={true}
                                className="rounded shadow-lg p-0 custom-tooltip"
                              >
                                <div
                                  style={{
                                    maxWidth: 480,
                                    minWidth: 400,
                                    overflow: "visible",
                                    whiteSpace: "normal",
                                    padding: 10,
                                    background: "white",
                                    borderRadius: 10,
                                    boxShadow: "0 8px 22px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.08)",
                                  }}
                                >
                                  <div style={{ marginBottom: 6, fontWeight: 700 }}>
                                    Garbage Point Info
                                  </div>
                                  <TooltipContent row={row} />
                                </div>
                              </LeafletTooltip>
                            </Marker>
                          );
                        })}
                    </MapContainer>
                  </div>

                  <h2 className="text-2xl font-bold mt-8 text-center text-black ">
                    Key Findings from the GVP Survey
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                    <div className="space-y-6">
                      {/* Problems */}
                      <div className="bg-white px-6 py-5 rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Top Problems Faced by Residents around GVP
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={problemsData} layout="vertical"
                            margin={{
                              top: 10,
                              right: isSmallScreen ? 50 : 90,
                              left: 10,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={isSmallScreen ? 70 : 130}
                              tick={{ fontSize: isSmallScreen ? 9 : 12 }}
                              tickFormatter={(value) =>
                                value.length > 18 ? value.slice(0, 18) + "…" : value
                              }
                            />
                            <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                            <Bar
                              dataKey="value"
                              barSize={isSmallScreen ? 14 : 22}
                              label={renderCustomBarLabel}
                            >
                              {problemsData.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Settings */}
                      <div className="bg-white px-6 py-5 rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Top Settings Where GVPs Are Found
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={settingData}
                            layout="vertical"
                            margin={{
                              top: 10,
                              right: isSmallScreen ? 50 : 90,
                              left: 10,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={isSmallScreen ? 90 : 160}
                              tick={{ fontSize: isSmallScreen ? 10 : 14 }}
                            />
                            <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                            <Bar
                              dataKey="value"
                              barSize={isSmallScreen ? 14 : 22}
                              label={renderCustomBarLabel}
                            >
                              {settingData.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Who Dispose */}
                      <div className="bg-white px-6 py-5 rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Who is Disposing the most Waste (as per Citizens)
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={whoDisposeData}
                            layout="vertical"
                            margin={{
                              top: 10,
                              right: isSmallScreen ? 50 : 90,
                              left: 10,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={isSmallScreen ? 90 : 160}
                              tick={{ fontSize: isSmallScreen ? 10 : 14 }}
                            />
                            <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                            <Bar
                              dataKey="value"
                              barSize={isSmallScreen ? 14 : 22}
                              label={renderCustomBarLabel}
                            >
                              {whoDisposeData.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Reasons */}
                      <div className="bg-white px-6 py-5 rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Reasons for Waste Accumulation
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={reasonsData}
                            layout="vertical"
                            margin={{
                              top: 10,
                              right: isSmallScreen ? 50 : 90,
                              left: 10,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={isSmallScreen ? 90 : 160}
                              tick={{ fontSize: isSmallScreen ? 10 : 14 }}
                            />
                            <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                            <Bar
                              dataKey="value"
                              barSize={isSmallScreen ? 14 : 22}
                              label={renderCustomBarLabel}
                            >
                              {reasonsData.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Footer */}
                    <footer className="mt-12 pb-4 text-center">
                      <a
                        href="https://themetropolitaninstitute.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-bold text-gray-600 hover:text-blue-400 transition duration-300"
                      >
                        Developed by The Metropolitan Institute
                      </a>
                    </footer>

                  </div>
                </>
              ) : (
                <div className="hidden lg:block w-full h-full">
                </div>
              )}
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
