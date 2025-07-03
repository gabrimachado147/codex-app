import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-svg-charts';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  value: number;
  label?: string;
  color?: string;
}

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie';
  data: ChartData[];
  title: string;
  height?: number;
  showGrid?: boolean;
}

export function AnalyticsChart({ 
  type, 
  data, 
  title, 
  height = 200, 
  showGrid = true 
}: AnalyticsChartProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const chartWidth = screenWidth - 32;

  const renderChart = () => {
    const values = data.map(d => d.value);
    
    switch (type) {
      case 'line':
        return (
          <LineChart
            style={{ height, width: chartWidth }}
            data={values}
            svg={{ stroke: colors.primary, strokeWidth: 2 }}
            contentInset={{ top: 20, bottom: 20 }}
            gridMin={0}
          />
        );
        
      case 'bar':
        return (
          <BarChart
            style={{ height, width: chartWidth }}
            data={values}
            svg={{ fill: colors.primary }}
            contentInset={{ top: 20, bottom: 20 }}
            gridMin={0}
          />
        );
        
      case 'pie':
        const pieData = data.map((item, index) => ({
          value: item.value,
          svg: {
            fill: item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`,
          },
          key: `pie-${index}`,
        }));
        
        return (
          <View style={styles.pieContainer}>
            <PieChart
              style={{ height, width: height }}
              data={pieData}
              innerRadius={20}
              outerRadius={height / 2 - 10}
            />
            <View style={styles.pieLegend}>
              {data.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendColor, 
                      { backgroundColor: item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)` }
                    ]} 
                  />
                  <Text style={styles.legendText}>
                    {item.label}: {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieLegend: {
    marginLeft: 20,
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
  },
});