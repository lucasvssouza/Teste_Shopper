const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating); // Número de estrelas cheias
    const halfStars = rating % 1 !== 0; // Verifica se há meia estrela
    const emptyStars = 5 - Math.ceil(rating); // Estrelas vazias
  
    return (
      <div>
        {'★'.repeat(fullStars)}
        {halfStars && '✩'}
        {'☆'.repeat(emptyStars)}
      </div>
    );
  };
  
  export default RatingStars;
  