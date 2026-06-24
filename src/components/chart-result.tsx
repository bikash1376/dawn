'use client';

import { useRef } from 'react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, BarChart3 } from 'lucide-react';

interface ChartResultProps {
    result: {
        title: string;
        chartType: 'bar' | 'line' | 'area' | 'pie';
        xKey: string;
        keys: string[];
        data: Record<string, string | number>[];
        colors: string[];
    };
}

export function ChartResult({ result }: ChartResultProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { title, chartType, xKey, keys, data, colors } = result;

    // Export the rendered recharts SVG as a PNG.
    const exportPng = () => {
        const svg = containerRef.current?.querySelector('svg');
        if (!svg) return;
        const clone = svg.cloneNode(true) as SVGSVGElement;
        const bbox = svg.getBoundingClientRect();
        const width = Math.max(1, Math.round(bbox.width));
        const height = Math.max(1, Math.round(bbox.height));
        clone.setAttribute('width', String(width));
        clone.setAttribute('height', String(height));
        const xml = new XMLSerializer().serializeToString(clone);
        const svg64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;

        const img = new Image();
        img.onload = () => {
            const scale = 2; // higher-res export
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const link = document.createElement('a');
            link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'chart'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = svg64;
    };

    const tooltipStyle = {
        background: 'var(--popover, #fff)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 8,
        fontSize: 12,
    };

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey={xKey} fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        {keys.map((k, i) => (
                            <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                        ))}
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey={xKey} fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        {keys.map((k, i) => (
                            <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.25} strokeWidth={2} />
                        ))}
                    </AreaChart>
                );
            case 'pie': {
                const pieData = data.map((row) => ({ name: String(row[xKey]), value: Number(row[keys[0]]) }));
                return (
                    <PieChart>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                            {pieData.map((_, i) => (
                                <Cell key={i} fill={colors[i % colors.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                );
            }
            case 'bar':
            default:
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey={xKey} fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Legend />
                        {keys.map((k, i) => (
                            <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    {title}
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 cursor-pointer" onClick={exportPng}>
                    <Download className="w-3 h-3" />
                    PNG
                </Button>
            </div>
            <div ref={containerRef} className="w-full h-[280px] rounded-lg border border-border/40 bg-background/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
