// Navigate through the real launcher before exercising a search. Tests that
// previously searched from Street now share the same route as the player.
module.exports = function phoneSearch({ screen, fireEvent }) {
  return function searchButton(label) {
    searchButton.returnToLocation = true;
    if (!document.querySelector('.phone-screen')) fireEvent.click(screen.getByRole('button', { name: 'Phone', exact: true }));
    const back = screen.queryByRole('button', { name: 'Back to phone', exact: true });
    if (back) fireEvent.click(back);
    fireEvent.click(screen.getByRole('button', { name: 'Find Help', exact: true }));
    return screen.getByRole('button', { name: label, exact: true });
  };
};
