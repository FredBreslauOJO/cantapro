import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
  },
  songRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 10,
    alignItems: 'center',
  },
  songIndex: {
    width: '10%',
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#aaaaaa',
    textAlign: 'right',
    paddingRight: 8,
  },
  songTitle: {
    width: '75%',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    paddingRight: 8,
  },
  songDuration: {
    width: '15%',
    fontSize: 11,
    textAlign: 'right',
    color: '#888888',
  },
  divisorRow: {
    backgroundColor: '#f4f4f4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  divisorText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    fontSize: 9,
    textAlign: 'center',
    color: '#aaaaaa',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
  },
});

const formatDuration = (seconds) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function SetlistPdfDocument({ eventName, bandName, date, orderedItems, songMap }) {
  let songNum = 0;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{eventName || 'SETLIST'}</Text>
            {bandName ? <Text style={styles.subtitle}>{bandName}</Text> : null}
          </View>
          {date ? (
            <Text style={styles.dateText}>
              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </Text>
          ) : null}
        </View>

        {/* Items */}
        {orderedItems.map((item, idx) => {
          if (item.item_type === 'divider') {
            return (
              <View key={item.id || idx} style={styles.divisorRow}>
                <Text style={styles.divisorText}>{item.content || ''}</Text>
              </View>
            );
          }

          songNum++;
          const song = songMap[item.song_id];
          if (!song) return null;

          return (
            <View key={item.id || idx} style={styles.songRow} wrap={false}>
              <Text style={styles.songIndex}>{songNum}.</Text>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songDuration}>{formatDuration(song.duration_seconds)}</Text>
            </View>
          );
        })}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Gerado por canta.pro  —  Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}