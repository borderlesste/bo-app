import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartCard = ({ title, data, type = 'line', color = '#3B82F6', className = '' }) => {
  const generateColors = (count) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];
    return colors.slice(0, count);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        border: {
          display: false
        }
      }
    } : undefined
  };

  const processData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    if (type === 'line' || type === 'bar') {
      // Para gráficos de línea y barra con datos temporales
      return {
        labels: data.map(item => item.month || item.label || item.name),
        datasets: [{
          label: title,
          data: data.map(item => item.total || item.value || item.newClients || item.count),
          backgroundColor: type === 'line' ? 
            `${color}20` : 
            color,
          borderColor: color,
          borderWidth: 2,
          fill: type === 'line',
          tension: type === 'line' ? 0.4 : undefined,
          borderRadius: type === 'bar' ? 4 : undefined
        }]
      };
    } else {
      // Para gráficos circulares (pie, doughnut)
      const colors = generateColors(data.length);
      return {
        labels: data.map(item => item.status || item.category || item.label || item.name),
        datasets: [{
          data: data.map(item => item.count || item.value),
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      };
    }
  };

  const chartData = processData();

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options: chartOptions
    };

    switch (type) {
      case 'line':
        return <Line {...commonProps} />;
      case 'bar':
        return <Bar {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      default:
        return <Line {...commonProps} />;
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {data && data.length > 0 ? (
        <div className="h-64">
          {renderChart()}
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No hay datos disponibles</p>
          </div>
        </div>
      )}
    </div>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string,
      label: PropTypes.string,
      name: PropTypes.string,
      total: PropTypes.number,
      value: PropTypes.number,
      newClients: PropTypes.number,
      count: PropTypes.number,
      status: PropTypes.string,
      category: PropTypes.string
    })
  ),
  type: PropTypes.oneOf(['line', 'bar', 'doughnut', 'pie']),
  color: PropTypes.string,
  className: PropTypes.string
};

export default ChartCard;